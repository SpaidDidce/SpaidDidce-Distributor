using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.Services.Interfaces;
using BackendSource.Services.task;
using Microsoft.EntityFrameworkCore;

namespace BackendSource.Services.CompleteServices
{
    public class MeService(DbContextBa context) : IMeService
    {
        private readonly DbContextBa _context = context;

        public async Task<bool> BuyGame(Guid userId ,Guid GameId)
        {
            var game = await _context.Games.FirstOrDefaultAsync(p => p.GameId == GameId);
            if (game == null)
            {
                return false;
            }

            var newLicense = new LicencesTable()
            {
                LicenceId = Guid.NewGuid(),
                GameId = GameId,
                PlayerId = userId,
                GrantedAt = DateTime.UtcNow,
                Game = game,
            };

            _context.Licences.Add(newLicense);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<GetMyLibraryTask> GetLibrary(Guid UserId)
        {
            var player = await _context.Users.FirstOrDefaultAsync(p => p.Id == UserId);
            List<LicencesTable> Licenses = await _context.Licences.Where(p => p.Player == player).ToListAsync();
            List<GamesTable> games = new List<GamesTable>();

            foreach (var game in Licenses)
            {
                var g = await _context.Games.FirstOrDefaultAsync(p => p.GameId == game.GameId);
                games.Add(g);
            }

            return GetMyLibraryTask.OnSuccess(games);
        }

        public async Task<bool> GetIfGameIHaveit(Guid userId, Guid GameId)
        {
            return await _context.Licences.AnyAsync(p => p.PlayerId == userId && p.GameId == GameId);
        }

        public string GetUser(Guid userId)
        {
            var user = _context.Users.FirstOrDefault(p => p.Id == userId);
            if (user == null)
                return "User not found";

            return user.Email;
        }
    }
}
