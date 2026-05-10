using BackendSource.DTOs.keyDtos;
using BackendSource.Services.task;

namespace BackendSource.Services.APIServices
{
    public interface IKeyService
    {
        public Task<CreateKeyServiceTask> CreateKey(CreateKeyDto dto);
        public Task<DeleteKeyServiceTaks> DeleteKey(DeleteKeyDto dto);
        public Task<bool> RedeemKey(RedeemKeyDto dto);
    }
}
