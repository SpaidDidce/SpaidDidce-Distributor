using System.ComponentModel.DataAnnotations;

namespace BackendSource.DataBaseSystem.GamesAndCodes
{
    public class GameVersionTable
    {
        [Key]
        public Guid GameVersionId { get; set; }
        public Guid GameId { get; set; }
        public GamesTable Game { get; set; } = null!;
        public string Version { get; set; } = string.Empty;
        public string UpdateDesc { get; set; } = string.Empty;
        public string hashFromVersion { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long Size { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
