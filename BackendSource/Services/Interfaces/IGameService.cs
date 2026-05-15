using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DTOs.GamesDtos;
using Microsoft.EntityFrameworkCore;

namespace BackendSource.Services.APIServices
{
    public interface IGameService
    {
        public Task<GamesTable?> GetGameFromId(Guid gameId);
        public Task<GamesTable?> GetGameFromName(string gameName);
        public Task<bool> getNewUpdate(string VersionInPc, Guid gameId);
        public Task<GameVersionTable?> GetLatestVersion(Guid id);
        public Task<string> GetLastVersionDesc(Guid GameId);
        public Task<List<GamesTable>> GetAllPublicGames();
        public Task<DataBaseSystem.Programers.TeamProgramingDatabse?> GetTeamFromGame(Guid gameId);
    }
}
