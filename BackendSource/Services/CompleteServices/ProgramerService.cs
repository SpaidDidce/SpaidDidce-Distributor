using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DataBaseSystem.Programers;
using BackendSource.DTOs.GamesDtos;
using BackendSource.DTOs.ProgramerDtos;
using BackendSource.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography.X509Certificates;

namespace BackendSource.Services.CompleteServices
{
    public class ProgramerService(DbContextBa context) : IProgramerService
    {
        private readonly DbContextBa _context = context;


        public async Task<TeamProgramingDatabse?> AddPlayerToTeam(Guid TeamId, AddPlayerToTeamDto dto)
        {
            var team = await _context.ProgramersTeams.FirstAsync(p => p.TeamId == TeamId);
            var NewPlayer = await _context.Users.FirstOrDefaultAsync(p => p.Id == dto.PlayerId);

            team.UsersInTeam.Add(NewPlayer);
            await _context.SaveChangesAsync();
            return team;
        }

        public async Task<TeamProgramingDatabse?> ChangeTeamName(Guid teamId, ChangeNameTeamDto dto)
        {
            var Team = await _context.ProgramersTeams.FirstAsync(p => p.TeamId == teamId);
            Team.TeamName = dto.NewName;

            await _context.SaveChangesAsync();
            return Team;
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
            newGame.GameVersions.Add(newVersion);
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

        public async Task<GamesTable?> updateGame(Guid TeamId, newVersionDto dto)
        {
            var game = await _context.Games.FirstOrDefaultAsync(P => P.GameId == dto.GameId);
            


            var NewVersion = new GameVersionTable()
            {
                GameId = game.GameId,
                Version = dto.newVersion,
                FileName = dto.nameFile,
                UpdateDesc = dto.UpdateDesc,
            };

            _context.GameVersions.Add(NewVersion);
            game.GameVersions.Add(NewVersion);
            await _context.SaveChangesAsync();
            return game;
        }
    }
}
