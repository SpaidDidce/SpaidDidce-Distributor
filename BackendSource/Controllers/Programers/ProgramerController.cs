using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.GamesAndCodes;
using BackendSource.DTOs.GamesDtos;
using BackendSource.DTOs.ProgramerDtos;
using BackendSource.Security;
using BackendSource.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Controllers.Programers
{
    [ApiController]
    [Route("[controller]")]
    public class ProgramerController(IProgramerService service) : Controller
    {
        private readonly IProgramerService _programerService = service;


        [TeamKey]
        [HttpPost("uploadgame")]
        public async Task<IActionResult> UploadGame(Guid TeamId, Guid Gameid, IFormFile gameFile, string versionDescription)
        {
            if (gameFile == null || gameFile.Length == 0)
                return BadRequest("No se ha enviado ningún archivo.");

            if (!gameFile.FileName.EndsWith(".zip"))
                return BadRequest("Solo se admiten archivos .zip");

            var savePath = Path.Combine(Directory.GetCurrentDirectory(), "GameFiles", Gameid.ToString(), gameFile.FileName);

            Directory.CreateDirectory(Path.GetDirectoryName(savePath));

            using (var stream = new FileStream(savePath, FileMode.Create))
            {
                await gameFile.CopyToAsync(stream);
            }
            return Ok(new { message = "Juego subido con éxito", fileSize = gameFile.Length });
        }

        [TeamKey(OnlyOwner = true)]
        [HttpPost("creategame")]
        public async Task<IActionResult> CreateGame(Guid TeamId, CreateNewGameDto dto)
        {
            var result = await _programerService.createNewGame(dto);
            if (result == null)
            {
                return BadRequest("Something is wrong, try again later");
            }

            return Ok("Game Create successfully");
        }

        [Authorize]
        [HttpPost("createteam")]
        public async Task<IActionResult> CreateTeam(CreateNewTeamDto dto)
        {
            var result = await _programerService.CreateNewTeam(dto);
            if (result == null)
            {
                return BadRequest("Something is wrong, try again later");
            }

            return Ok("Team Create Succesfully");
        }

        [TeamKey(OnlyOwner = true)]
        [HttpPost("changeteamname")]
        public async Task<IActionResult> changeteamname(Guid TeamId, string NewName)
        {


            return Ok();
        }

        [TeamKey(OnlyOwner = true)]
        [HttpPost("addplayertoteam")]
        public async Task<IActionResult> AddPlayerToTeam(Guid TeamId, Guid NewPlayerId)
        {


            return Ok();
        }
    }
}
