using BackendSource.DataBaseSystem.GamesAndCodes;

namespace BackendSource.Services.task
{
    public class GetMyLibraryTask
    {
        public string errorMessage { get; set; }

        public bool IsSuccess { get; set; }

        public List<GamesTable>? Games { get; set; }

        private GetMyLibraryTask(bool success, string ErrorMessage, List<GamesTable>? games)
        {
            errorMessage = ErrorMessage;
            IsSuccess = success;
            Games = games;
        }

        public static GetMyLibraryTask OnSuccess(List<GamesTable> Games)
            => new GetMyLibraryTask(true, string.Empty, Games);

        public static GetMyLibraryTask OnFailed(string ErrorMessage)
            => new GetMyLibraryTask(false, ErrorMessage, null);
    }
}
