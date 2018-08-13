module.exports = 
{
  async doesThrow(a)
  {
    try
    {
      await a;
      return false;
    }
    catch(e) {}
    return true;
  },

}