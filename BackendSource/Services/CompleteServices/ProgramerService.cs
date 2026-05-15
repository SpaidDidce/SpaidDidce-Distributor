using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DataBaseSystem.Programers;
using BackendSource.DTOs.GamesDtos;
using BackendSource.DTOs.ProgramerDtos;
using BackendSource.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

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

        public async Task<GamesTable> createNewGame(Guid teamId, CreateNewGameDto dto)
        {
            var newGame = new GamesTable()
            {
                GameId = Guid.NewGuid(),
                GameName = dto.GameName,
                GameDescription = dto.GameDescription,
                ExeName = dto.ExeName,
                TeamId = teamId,
                GameItsFree = dto.ItsFree,
                Price = dto.Price
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

        public async Task<TeamProgramingDatabse?> CreateNewTeam(Guid OwnerId, CreateNewTeamDto dto)
        {
            var newTeam = new TeamProgramingDatabse()
            {
                TeamId = Guid.NewGuid(),
                TeamName = dto.TeamName,
                OwnerId = OwnerId,
            };

            _context.ProgramersTeams.Add(newTeam);
            await _context.SaveChangesAsync();
            return newTeam;
        }

        public async Task<bool> deleteTeam(Guid TeamId)
        {
            var team = await _context.ProgramersTeams.FirstOrDefaultAsync(p => p.TeamId == TeamId);
            if (team == null)
            {
                return true;
            }

            if (team.UsersInTeam == null)
            {
            }
            else
            {
                var users = team.UsersInTeam;

                foreach(var user in users)
                {
                    team.UsersInTeam.Remove(user);
                }
            }


            var games = await _context.Games.Where(g => g.TeamId == TeamId).ToListAsync();

            foreach (var game in games)
            {
                game.GameIsPublic = false;
            }


            team.ItsRevoked = true;
            team.RevokedReason = BackendSource.Enums.ERevokedReasonsTeamType.Disband;
            team.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<TeamProgramingDatabse>> GetTeamFromPlayer(Guid playerId)
        {
            var player = await _context.Users.FirstOrDefaultAsync(p => p.Id == playerId);
            if (player == null)
            {
                return new List<TeamProgramingDatabse>();
            }

            var teams = await _context.ProgramersTeams
                .Where(p => p.OwnerId == player.Id)
                .ToListAsync();

            return teams;
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

        public async Task<bool> publicGame(Guid TeamId, PublicGameDto dto)
        {
            var game = await _context.Games.FirstOrDefaultAsync(p => p.GameId == dto.GameId && p.TeamId == TeamId);
            if (game == null)
            {
                return false;
            }

            game.GameIsPublic = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<GamesTable>> GetGameList(Guid TeamId)
        {
            List<GamesTable> games = await _context.Games.Where(p => p.TeamId == TeamId).ToListAsync();
            
            return games;
        }
    }
}
