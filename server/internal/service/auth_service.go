package service

import (
	"errors"
	"fmt"
	"server/internal/config"
	"server/internal/models"
	"server/internal/repository"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

/**
 * AuthService 认证服务
 */
type AuthService struct {
	userRepo *repository.UserRepository
}

/**
 * NewAuthService 创建认证服务
 */
func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{
		userRepo: repository.NewUserRepository(db),
	}
}

/**
 * Register 注册新用户
 */
func (s *AuthService) Register(req *models.RegisterRequest) (*models.User, error) {
	// 检查邮箱是否已存在
	exists, err := s.userRepo.ExistsByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("email already exists")
	}

	// 检查用户名是否已存在
	exists, err = s.userRepo.ExistsByUsername(req.Username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("username already exists")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 创建用户
	user := &models.User{
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Role:      "user", // 默认角色为普通用户
		Active:    true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 如果是第一个用户，设置为管理员
	count, err := s.userRepo.CountUsers()
	if err != nil {
		return nil, err
	}
	if count == 0 {
		user.Role = "admin"
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

/**
 * Login 用户登录
 */
func (s *AuthService) Login(req *models.LoginRequest) (*models.User, error) {
	// 根据邮箱查找用户
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid email or password")
		}
		return nil, err
	}

	// 检查用户是否激活
	if !user.Active {
		return nil, errors.New("user account is deactivated")
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	return user, nil
}

/**
 * GenerateToken 生成JWT token
 */
func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	// 解析过期时间
	expiry, err := time.ParseDuration(config.AppConfig.JWTExpiry)
	if err != nil {
		expiry = 24 * time.Hour // 默认24小时
	}

	// 创建claims
	claims := jwt.MapClaims{
		"userId":   user.ID,
		"username": user.Username,
		"email":    user.Email,
		"role":     user.Role,
		"exp":      time.Now().Add(expiry).Unix(),
		"iat":      time.Now().Unix(),
	}

	// 创建token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 签名token
	tokenString, err := token.SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

/**
 * ValidateToken 验证JWT token
 */
func (s *AuthService) ValidateToken(tokenString string) (*models.JWTClaims, error) {
	// 解析token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// 验证签名方法
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	// 验证token是否有效
	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// 提取claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// 提取用户信息
	userID, ok := claims["userId"].(float64)
	if !ok {
		return nil, errors.New("invalid userId in token")
	}

	username, ok := claims["username"].(string)
	if !ok {
		return nil, errors.New("invalid username in token")
	}

	email, ok := claims["email"].(string)
	if !ok {
		return nil, errors.New("invalid email in token")
	}

	role, ok := claims["role"].(string)
	if !ok {
		return nil, errors.New("invalid role in token")
	}

	return &models.JWTClaims{
		UserID:   uint(userID),
		Username: username,
		Email:    email,
		Role:     role,
	}, nil
}

/**
 * GetUserByID 根据ID获取用户
 */
func (s *AuthService) GetUserByID(id uint) (*models.User, error) {
	return s.userRepo.GetByID(id)
}

/**
 * IsRegistrationAllowed 检查是否允许注册
 * 当前策略：只允许注册一个用户（管理员）
 */
func (s *AuthService) IsRegistrationAllowed() (bool, error) {
	count, err := s.userRepo.CountUsers()
	if err != nil {
		return false, err
	}
	// 如果用户数为0，允许注册第一个用户（管理员）
	return count == 0, nil
}
