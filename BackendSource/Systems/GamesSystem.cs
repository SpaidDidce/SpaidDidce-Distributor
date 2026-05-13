using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DTOs.GamesDtos;
using BackendSource.Services.APIServices;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Semver;
using System.Runtime.Intrinsics.X86;

namespace BackendSource.Systems
{
    public class GamesSystem(DbContextBa context) : IGameService
    {
        private readonly DbContextBa _context = context;

        public async Task<GamesTable?> GetGameFromId(Guid gameId)
        {
            var game = await _context.Games.FirstOrDefaultAsync(p=> p.GameId == gameId);
            return game;
        }

        public async Task<GamesTable?> GetGameFromName(string gameName)
        {
            var game = await _context.Games.FirstOrDefaultAsync(p=> p.GameName == gameName && p.GameIsPublic);
            return game;
        }

        public async Task<GamesTable> createNewGame(CreateNewGameDto dto)
        {
            var NewGame = new GamesTable()
            {
                GameId = Guid.NewGuid(),
                GameName = dto.GameName,
                GameDescription = dto.GameDescription,
                GameItsFree = dto.ItsFree,
                Price = dto.Price
            };

            var NewGameVersion = new GameVersionTable()
            {
                GameId = NewGame.GameId,
                GameVersionId = Guid.NewGuid(),
                Version = "1.0.0",
                FileName = dto.FileName,
                hashFromVersion = dto.sha256,
                Game = NewGame,
                CreatedAt = DateTime.UtcNow
            };


            var path = Path.GetFullPath($"GameFiles/{NewGame.GameId}");

            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }

            _context.Games.Add(NewGame);
            _context.GameVersions.Add(NewGameVersion);

            await _context.SaveChangesAsync();
            return NewGame;
        }

        public async Task<GamesTable?> updateGame(newVersionDto dto)
        {
            var game = await _context.Games.FirstOrDefaultAsync(p => p.GameId == dto.GameId);

            _context.GameVersions.Add(new GameVersionTable()
            {
                GameId = dto.GameId,
                GameVersionId = Guid.NewGuid(),
                Version = dto.newVersion,
                FileName = dto.nameFile,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return game;
        }

        public async Task<bool> getNewUpdate(string VersionInPc, Guid gameId)
        {

            var v1 = SemVersion.Parse(VersionInPc);

            var versions = await _context.GameVersions
                .Where(p => p.GameId == gameId && !string.IsNullOrEmpty(p.Version))
                .ToListAsync();

            var latest = versions
                .OrderByDescending(v => SemVersion.Parse(v.Version), SemVersion.PrecedenceComparer)
                .FirstOrDefault();

            if (latest == null)
                return false;

            var v2 = SemVersion.Parse(latest.Version);

            return SemVersion.ComparePrecedence(v2, v1) > 0;
        }

        public async Task<GameVersionTable?> GetLatestVersion(Guid id)
        {
            var latest = await _context.GameVersions
                .Where(x => x.GameId == id && !string.IsNullOrEmpty(x.Version))
                .ToListAsync();

            if (latest.Count == 0) return null;

            return latest.OrderByDescending(v => SemVersion.Parse(v.Version), SemVersion.PrecedenceComparer).FirstOrDefault();
        }
        
        public async Task<string> GetLastVersionDesc(Guid GameId)
        {
            var versions = await _context.GameVersions
                .Where(p => p.GameId == GameId && !string.IsNullOrEmpty(p.Version))
                .ToListAsync();

            var latest = versions
                .OrderByDescending(v => SemVersion.Parse(v.Version), SemVersion.PrecedenceComparer)
                .FirstOrDefault();

            if (latest == null)
            {
                return "Game Doesnt Exist";
            }

            return latest.UpdateDesc;
        }

        public async Task<List<GamesTable>> GetAllPublicGames()
        {
            var allGamePublic = await _context.Games
                .Where(p => p.GameIsPublic)
                .ToListAsync();

            return allGamePublic;
        }
    }
}
