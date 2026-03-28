package repository

import (
	"server/internal/models"
	"time"

	"gorm.io/gorm"
)

type AccessTokenRepository struct {
	db *gorm.DB
}

func NewAccessTokenRepository(db *gorm.DB) *AccessTokenRepository {
	return &AccessTokenRepository{db: db}
}

func (r *AccessTokenRepository) Create(t *models.AccessToken) error {
	return r.db.Create(t).Error
}

func (r *AccessTokenRepository) GetByToken(token string) (*models.AccessToken, error) {
	var t models.AccessToken
	if err := r.db.Where("token = ?", token).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *AccessTokenRepository) MarkUsed(token string) error {
	return r.db.Model(&models.AccessToken{}).
		Where("token = ?", token).
		Update("used", true).Error
}

func (r *AccessTokenRepository) ListByUser(userID uint) ([]*models.AccessToken, error) {
	var tokens []*models.AccessToken
	if err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&tokens).Error; err != nil {
		return nil, err
	}
	return tokens, nil
}

func (r *AccessTokenRepository) Delete(token string) error {
	return r.db.Delete(&models.AccessToken{}, "token = ?", token).Error
}

func (r *AccessTokenRepository) DeleteExpired() error {
	return r.db.Delete(&models.AccessToken{}, "expires_at < ?", time.Now()).Error
}
