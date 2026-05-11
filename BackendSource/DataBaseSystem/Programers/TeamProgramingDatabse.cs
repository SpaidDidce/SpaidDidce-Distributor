using BackendSource.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendSource.DataBaseSystem.Programers
{
    [Table("teamTable")]
    public class TeamProgramingDatabse
    {
        [Key]
        public Guid TeamId { get; set; }

        public List<Guid>? GameId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool ItsRevoked { get; set; } = false;
        public DateTime? RevokedAt { get; set; }
        public ERevokedReasonsTeamType? RevokedReason { get; set; }
        public List<UserTable>? UsersInTeam { get; set; }
        public Guid OwnerId { get; set; }
    }
}
