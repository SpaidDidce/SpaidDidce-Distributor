using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DTOs.keyDtos;
using BackendSource.Services.APIServices;
using BackendSource.Services.task;
using Microsoft.EntityFrameworkCore;

namespace BackendSource.Services.CompleteServices
{
    public class KeyService(DbContextBa context) : IKeyService
    {
        private readonly DbContextBa _context = context;

        public async Task<CreateKeyServiceTask> CreateKey(CreateKeyDto dto)
        {
            var newKey = new GamesKeys()
            {
                KeyId = Guid.NewGuid(),
                GameId = dto.GameId
            };

            _context.GamesKeys.Add(newKey);
            await _context.SaveChangesAsync();
            return CreateKeyServiceTask.OnSuccess(newKey);
        }

        public async Task<DeleteKeyServiceTaks> DeleteKey(DeleteKeyDto dto)
        {
            var key = await _context.GamesKeys.FirstAsync(p => p.KeyId == dto.KeyId);
            if (key == null)
            {
                return DeleteKeyServiceTaks.OnFailed("Key Doesnt Exist");
            }

            _context.GamesKeys.Remove(key);

            await _context.SaveChangesAsync();
            return DeleteKeyServiceTaks.OnSuccess();
        }

        public async Task<bool> RedeemKey(RedeemKeyDto dto)
        {
            var keyGame = await _context.GamesKeys.FirstAsync(p => p.KeyId == dto.KeyId);
            if (keyGame == null)
            {
                return false;
            }

            var licence = new LicencesTable()
            {
                GameId = keyGame.GameId,
                LicenceId = Guid.NewGuid(),
                PlayerId = dto.UserId
            };

            _context.GamesKeys.Remove(keyGame);
            _context.Licences.Add(licence);
            
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
