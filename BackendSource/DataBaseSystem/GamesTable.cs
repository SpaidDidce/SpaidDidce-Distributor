using System.ComponentModel.DataAnnotations;

namespace BackendSource.DataBaseSystem
{
    public class GamesTable
    {
        [Key]
        public Guid GameId { get; set; }
        public string GameName { get; set; } = string.Empty;
        public string GameDescription { get; set; } = string.Empty;
        public List<GameVersionTable> GameVersions { get; set; } = new();
    }
}