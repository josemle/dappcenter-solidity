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
  },

  logContainsDataNumber(transaction, expectedValue)
  {
    return null != transaction.receipt.logs.find((value) => parseInt(value.data, 16) == expectedValue)
  },

  toCsv(data)
  {
    let resultString = "";
    for(const d of data)
    {
      resultString += d.toString() + ",";
    }
    return resultString;
  }
}