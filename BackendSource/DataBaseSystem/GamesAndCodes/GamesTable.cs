using System.ComponentModel.DataAnnotations;

namespace BackendSource.DataBaseSystem.GamesAndCodes
{
    public class GamesTable
    {
        [Key]
        public Guid GameId { get; set; }
        public Guid TeamId { get; set; }
        public string GameName { get; set; } = string.Empty;
        public string GameDescription { get; set; } = string.Empty;
        public string ExeName { get; set; } = string.Empty;
        public bool GameIsPublic { get; set; }
        public bool GameItsFree { get; set; } = false;
        public float Price { get; set; }
        public List<GameVersionTable> GameVersions { get; set; } = new();
    }
}
