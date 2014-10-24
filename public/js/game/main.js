
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Entry Point (Function called by the HTML canvas element)
//    This function calls the main function of the game choosed for the experiment
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function Main(xp_game,xptype) {
  if((xp_game == "space_coop") || (xp_game == "dg"))
  {
    Main_Space(xptype,xp_game);
  }
  else if(xp_game == "rabbits")
  {
    Main_Rabbits(xptype);
  }    
}

