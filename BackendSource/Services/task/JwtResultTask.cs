namespace BackendSource.Services.task
{
    public class JwtResultTask
    {
        public string Token { get; set; } = string.Empty;
        public DateTimeOffset Expires { get; set; }
    }
}
