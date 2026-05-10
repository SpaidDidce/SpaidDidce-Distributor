namespace BackendSource.DTOs.GamesDtos
{
    public class CreateNewGameDto
    {
        public Guid GameId { get; set; } = Guid.Empty;
        public string GameName { get; set; } = string.Empty;
        public string GameDescription { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string sha256 { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ExeName { get; set; } = string.Empty;

        public Guid TeamId { get; set; }
    }
}
