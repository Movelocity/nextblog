package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"server/internal/models"
	"server/internal/repository"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AdminService struct {
	userRepo  *repository.UserRepository
	tokenRepo *repository.AccessTokenRepository
	authSvc   *AuthService
}

func NewAdminService(db *gorm.DB) *AdminService {
	return &AdminService{
		userRepo:  repository.NewUserRepository(db),
		tokenRepo: repository.NewAccessTokenRepository(db),
		authSvc:   NewAuthService(db),
	}
}

// CreateUser creates a new user account. adminID is the caller for audit purposes.
func (s *AdminService) CreateUser(adminID uint, req *models.CreateUserRequest) (*models.User, error) {
	exists, err := s.userRepo.ExistsByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("email already exists")
	}

	exists, err = s.userRepo.ExistsByUsername(req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("username already exists")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	role := req.Role
	if role == "" {
		role = "user"
	}
	if role != "admin" && role != "editor" && role != "user" {
		return nil, errors.New("invalid role: must be admin, editor, or user")
	}

	user := &models.User{
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hashed),
		Role:      role,
		Active:    true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}
	return user, nil
}

// ListUsers returns a paginated list of all users.
func (s *AdminService) ListUsers(page, pageSize int) ([]*models.User, int64, error) {
	return s.userRepo.List(page, pageSize)
}

// GetUser returns a single user by ID.
func (s *AdminService) GetUser(id uint) (*models.User, error) {
	return s.userRepo.GetByID(id)
}

// UpdateUserRole changes a user's role or active status.
func (s *AdminService) UpdateUser(id uint, role string, active *bool) (*models.User, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if role != "" {
		if role != "admin" && role != "editor" && role != "user" {
			return nil, errors.New("invalid role: must be admin, editor, or user")
		}
		user.Role = role
	}
	if active != nil {
		user.Active = *active
	}
	user.UpdatedAt = time.Now()
	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}
	return user, nil
}

// CreateAccessToken mints a short random token for the given user.
func (s *AdminService) CreateAccessToken(adminID, userID uint, req *models.CreateTokenRequest) (*models.AccessToken, error) {
	// verify target user exists
	if _, err := s.userRepo.GetByID(userID); err != nil {
		return nil, errors.New("user not found")
	}

	// parse expiry
	expiresIn := req.ExpiresIn
	if expiresIn == "" {
		expiresIn = "168h" // 7 days
	}
	dur, err := time.ParseDuration(expiresIn)
	if err != nil {
		return nil, errors.New("invalid expiresIn duration (use Go format: 24h, 168h, etc.)")
	}

	// generate 32 random bytes → 64-char hex token
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return nil, err
	}
	tokenStr := hex.EncodeToString(raw)

	t := &models.AccessToken{
		Token:     tokenStr,
		UserID:    userID,
		CreatedBy: adminID,
		Label:     req.Label,
		ExpiresAt: time.Now().Add(dur),
		Used:      false,
		CreatedAt: time.Now(),
	}
	if err := s.tokenRepo.Create(t); err != nil {
		return nil, err
	}
	return t, nil
}

// ListAccessTokens returns all tokens issued for a user.
func (s *AdminService) ListAccessTokens(userID uint) ([]*models.AccessToken, error) {
	return s.tokenRepo.ListByUser(userID)
}

// RevokeAccessToken deletes a specific token.
func (s *AdminService) RevokeAccessToken(token string) error {
	return s.tokenRepo.Delete(token)
}

// ExchangeAccessToken validates a short token and returns a JWT for the associated user.
// The token is marked as used and cannot be reused.
func (s *AdminService) ExchangeAccessToken(tokenStr string) (string, *models.User, error) {
	t, err := s.tokenRepo.GetByToken(tokenStr)
	if err != nil {
		return "", nil, errors.New("invalid token")
	}
	if t.Used {
		return "", nil, errors.New("token already used")
	}
	if time.Now().After(t.ExpiresAt) {
		return "", nil, errors.New("token expired")
	}

	user, err := s.userRepo.GetByID(t.UserID)
	if err != nil {
		return "", nil, errors.New("user not found")
	}
	if !user.Active {
		return "", nil, errors.New("user account is deactivated")
	}

	// mark used before issuing JWT to prevent race-condition reuse
	if err := s.tokenRepo.MarkUsed(tokenStr); err != nil {
		return "", nil, err
	}

	jwt, err := s.authSvc.GenerateToken(user)
	if err != nil {
		return "", nil, err
	}
	return jwt, user, nil
}
