package models

import "time"

// AccessToken is a short-lived, single-use token an admin can issue for a user.
// The recipient exchanges it via POST /api/auth/token-exchange to receive a JWT.
type AccessToken struct {
	Token     string    `json:"token"      gorm:"primaryKey;size:64"`
	UserID    uint      `json:"userId"     gorm:"not null;index"`
	CreatedBy uint      `json:"createdBy"  gorm:"not null"`
	Label     string    `json:"label"      gorm:"size:100"`
	ExpiresAt time.Time `json:"expiresAt"  gorm:"not null;index"`
	Used      bool      `json:"used"       gorm:"default:false"`
	CreatedAt time.Time `json:"createdAt"`
}

// CreateUserRequest is the payload an admin sends to create a new user.
type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role"`   // admin | editor | user  (defaults to "user")
}

// CreateTokenRequest is the payload an admin sends to mint a short token.
type CreateTokenRequest struct {
	Label     string `json:"label"`
	ExpiresIn string `json:"expiresIn"` // e.g. "24h", "7d" – defaults to "7d"
}

// TokenExchangeRequest is the payload a user sends to swap a short token for a JWT.
type TokenExchangeRequest struct {
	Token string `json:"token" binding:"required"`
}
