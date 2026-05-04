using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendSource.DataBaseSystem.JwtAndRefreshTokens
{
    [Table("refreshTable")]
    public class RefreshToken
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.Empty;

        [Column("UserID")]
        [Required]
        public Guid UserId { get; set; } = Guid.Empty;

        [Column("Expired")]
        [Required]
        [MaxLength(255)]
        public DateTime ExpiresAt { get; set; }

        [Column("Revoked")]
        public bool Revoked { get; set; }

        [Column("Token")]
        [Required]
        [MaxLength(500)]
        public string TokenHash { get; set; } = string.Empty;
    }
}
