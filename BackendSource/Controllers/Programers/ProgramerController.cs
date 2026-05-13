using BackendSource.DTOs.GamesDtos;
using BackendSource.DTOs.ProgramerDtos;
using BackendSource.Security;
using BackendSource.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BackendSource.Controllers.Programers
{
    [ApiController]
    [Route("[controller]")]
    public class ProgramerController(IProgramerService service) : Controller
    {
        private readonly IProgramerService _programerService = service;


        [Authorize]
        [TeamKey]
        [HttpPost("uploadgame")]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> UploadGame(
            [FromQuery] Guid TeamId, 
            [FromQuery] Guid Gameid, 
            [FromQuery] string version, 
            [FromQuery] string versionDescription)
        {
            var gameFile = Request.Form.Files.FirstOrDefault();

            if (gameFile == null || gameFile.Length == 0)
                return BadRequest("No se ha enviado ningÃºn archivo o el archivo estÃ¡ vacÃ­o.");

            if (!gameFile.FileName.EndsWith(".zip"))
                return BadRequest("Solo se admiten archivos .zip");

            var savePath = Path.Combine(Directory.GetCurrentDirectory(), "GameFiles", Gameid.ToString(), gameFile.FileName);

            Directory.CreateDirectory(Path.GetDirectoryName(savePath));

            using (var stream = new FileStream(savePath, FileMode.Create))
            {
                await gameFile.CopyToAsync(stream);
            }

            var updateResult = await _programerService.updateGame(TeamId, new newVersionDto
            {
                GameId = Gameid,
                newVersion = version,
                nameFile = gameFile.FileName,
                UpdateDesc = versionDescription
            });

            if (updateResult == null)
                return BadRequest("El archivo se subiÃ³ pero no se pudo registrar la versiÃ³n en la DB.");

            return Ok(new { message = "Juego subido y registrado con Ã©xito", fileSize = gameFile.Length });
        }

        [Authorize]
        [TeamKey(OnlyOwner = true)]
        [HttpPost("creategame")]
        public async Task<IActionResult> CreateGame([FromQuery] Guid TeamId, CreateNewGameDto dto)
        {
            var result = await _programerService.createNewGame(TeamId ,dto);
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userIdClaim == null) return Unauthorized();

            Guid userId = Guid.Parse(userIdClaim);

            var result = await _programerService.CreateNewTeam(userId ,dto);
            if (result == null)
            {
                return BadRequest("Something is wrong, try again later");
            }

            return Ok("Team Create Succesfully");
        }

        [Authorize]
        [TeamKey(OnlyOwner = true)]
        [HttpPost("changeteamname")]
        public async Task<IActionResult> changeteamname(Guid TeamId, ChangeNameTeamDto dto)
        {
            var result = await _programerService.ChangeTeamName(TeamId, dto);
            if (result == null)
            {
                return BadRequest("Something is wrong, try again later");
            }

            return Ok("Team name Changed succesfully");
        }

        [Authorize]
        [TeamKey(OnlyOwner = true)]
        [HttpPost("addplayertoteam")]
        public async Task<IActionResult> AddPlayerToTeam(Guid TeamId, AddPlayerToTeamDto dto)
        {
            var result = await _programerService.AddPlayerToTeam(TeamId, dto);
            if (result == null)
            {
                return BadRequest("Something is wrong, try again later");
            }

            return Ok(result);
        }


        [Authorize]
        [HttpGet("getteam")]
        public async Task<IActionResult> GetTeamFromPlayer()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            Guid userId = Guid.Parse(userIdClaim);

            var result = await _programerService.GetTeamFromPlayer(userId);
            if (result == null)
            {
                return BadRequest("Something is wrong, try again later");
            }

            return Ok(result);
        }

        [TeamKey(OnlyOwner = true)]
        [HttpPost("deleteteam")]
        public async Task<IActionResult> DeleteTeam([FromQuery] Guid TeamId)
        {
            var result = await _programerService.deleteTeam(TeamId);
            if (!result)
            {
                return BadRequest("Something is wrong, try again later");
            }

            return Ok(result);
        }

        [TeamKey]
        [HttpPost("publicgame")]
        public async Task<IActionResult> publicgame(Guid TeamId, PublicGameDto dto)
        {
            var result = await _programerService.publicGame(TeamId, dto);
            if (!result)
            {
                return BadRequest("Something is wrong, try again later");
            }

            return Ok(result);
        }

        [TeamKey]
        [HttpGet("getgamesfromteam")]
        public async Task<IActionResult> getgameFromTeam(Guid TeamId)
        {
            var result = await _programerService.GetGameList(TeamId);
            if (result == null)
            {
                return BadRequest("Something is wrong, try again later");
            }

            return Ok(result);
        }
    }
}
