using System.ComponentModel.DataAnnotations;

namespace BackendSource.DataBaseSystem.GamesAndCodes
{
    public class GameVersionTable
    {
        [Key]
        public Guid GameVersionId { get; set; }
        public Guid GameId { get; set; }
        public GamesTable Game { get; set; } = null!;
        public string Version { get; set; } = "0.0.0";
        public string? UpdateDesc { get; set; }
        public string? hashFromVersion { get; set; }
        public string? FileName { get; set; }
        public long? Size { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
