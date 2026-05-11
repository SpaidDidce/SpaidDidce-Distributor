using BackendSource.Services.task;
using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Services.Interfaces
{
    public interface IMeService
    {
        public Task<GetMyLibraryTask> GetLibrary(Guid UserId);
        public Task<bool> BuyGame(Guid userId, Guid GameId);
        public Task<bool> GetIfGameIHaveit(Guid userId, Guid GameId);
    }
}
