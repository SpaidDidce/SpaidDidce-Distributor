using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DataBaseSystem.Programers;
using BackendSource.DTOs.GamesDtos;
using BackendSource.DTOs.ProgramerDtos;

namespace BackendSource.Services.Interfaces
{
    public interface IProgramerService
    {
        public Task<GamesTable> createNewGame(CreateNewGameDto dto);
        public Task<GamesTable?> updateGame(newVersionDto dto);
        public Task<TeamProgramingDatabse?> CreateNewTeam(CreateNewTeamDto dto);
        public Task<TeamProgramingDatabse?> AddPlayerToTeam(AddPlayerToTeamDto dto);
        public Task<TeamProgramingDatabse?> ChangeTeamName(string NewName);
    }
}
