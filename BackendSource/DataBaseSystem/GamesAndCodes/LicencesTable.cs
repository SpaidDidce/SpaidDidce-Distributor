using BackendSource.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendSource.DataBaseSystem.GamesAndCodes
{
    [Table("LicencesTable")]
    public class LicencesTable
    {
        [Key]
        public Guid LicenceId { get; set; }
        public Guid GameId { get; set; }
        public GamesTable Game { get; set; } = null!;
        public Guid PlayerId { get; set; }
        public UserTable Player { get; set; } = null!;
        public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
        public bool IsRevoked { get; set; }
        public EPlayerRevokedType RevokedReason { get; set; }
        public DateTime? RevokedAt { get; set; }
    }
}
