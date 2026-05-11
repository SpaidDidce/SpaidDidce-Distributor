namespace BackendSource.DTOs.GamesDtos
{
    public class newVersionDto
    {
        public Guid GameId { get; set; }
        public string newVersion { get; set; } = string.Empty;
        public string nameFile { get; set; } = string.Empty;
        public string UpdateDesc { get; set; } = string.Empty;
    }
}
