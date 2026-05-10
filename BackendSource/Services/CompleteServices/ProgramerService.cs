using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DataBaseSystem.Programers;
using BackendSource.DTOs.GamesDtos;
using BackendSource.DTOs.ProgramerDtos;
using BackendSource.Services.Interfaces;

namespace BackendSource.Services.CompleteServices
{
    public class ProgramerService(DbContextBa context) : IProgramerService
    {
        private readonly DbContextBa _context = context;


        public Task<TeamProgramingDatabse?> AddPlayerToTeam(AddPlayerToTeamDto dto)
        {
            throw new NotImplementedException();
        }

        public Task<TeamProgramingDatabse?> ChangeTeamName(string NewName)
        {
            throw new NotImplementedException();
        }

        public async Task<GamesTable> createNewGame(CreateNewGameDto dto)
        {
            var newGame = new GamesTable()
            {
                GameId = Guid.NewGuid(),
                GameName = dto.GameName,
                GameDescription = dto.GameDescription,
                ExeName = dto.ExeName
            };

            var newVersion = new GameVersionTable()
            {
                GameVersionId = Guid.NewGuid(),
                GameId = newGame.GameId,
                Game = newGame,
                CreatedAt = DateTime.UtcNow
            };


            _context.Games.Add(newGame);
            _context.GameVersions.Add(newVersion);
            await _context.SaveChangesAsync();
            return newGame;
        }

        public async Task<TeamProgramingDatabse?> CreateNewTeam(CreateNewTeamDto dto)
        {
            var newTeam = new TeamProgramingDatabse()
            {
                TeamId = Guid.NewGuid(),
                TeamName = dto.TeamName,
                OwnerId = dto.Owner.Id,
            };

            _context.ProgramersTeams.Add(newTeam);
            await _context.SaveChangesAsync();
            return newTeam;
        }

        public Task<GamesTable?> updateGame(newVersionDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
