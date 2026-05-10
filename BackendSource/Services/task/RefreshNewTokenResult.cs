namespace BackendSource.Services.task
{
    public class RefreshNewTokenResult
    {
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public string? token { get; set; }

        public static RefreshNewTokenResult Success(string tokenResult) => new() { IsSuccess = true, token = tokenResult };
        public static RefreshNewTokenResult Fail(string message) => new() { IsSuccess = false, ErrorMessage = message };
    }
}
