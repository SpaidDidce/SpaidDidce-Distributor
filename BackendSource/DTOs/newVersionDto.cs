namespace BackendSource.DTOs
{
    public class newVersionDto
    {
        public Guid GameId { get; set; } = Guid.NewGuid();
        public string newVersion { get; set; } = string.Empty;
        public string nameFile { get; set; } = string.Empty;
    }
}
