using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DataBaseSystem.Programers;
using BackendSource.DTOs.GamesDtos;
using BackendSource.DTOs.ProgramerDtos;

namespace BackendSource.Services.Interfaces
{
    public interface IProgramerService
    {
        public Task<GamesTable> createNewGame(Guid TeamId,CreateNewGameDto dto);
        public Task<GamesTable?> updateGame(Guid TeamId, newVersionDto dto);
        public Task<TeamProgramingDatabse?> CreateNewTeam(Guid OnwerId ,CreateNewTeamDto dto);
        public Task<TeamProgramingDatabse?> AddPlayerToTeam(Guid TeamId ,AddPlayerToTeamDto dto);
        public Task<TeamProgramingDatabse?> ChangeTeamName(Guid teamId, ChangeNameTeamDto dto);

        public Task<List<TeamProgramingDatabse>> GetTeamFromPlayer(Guid playerId);
        public Task<bool> deleteTeam(Guid TeamId);
        public Task<bool> publicGame(Guid TeamId, PublicGameDto dto);
        public Task<List<GamesTable>> GetGameList(Guid TeamId);
    }
}
