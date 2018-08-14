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

  async isLength(array, length)
  {
    return !await this.doesThrow(array.call(length - 1))
     && await this.doesThrow(array.call(length));
  }
}