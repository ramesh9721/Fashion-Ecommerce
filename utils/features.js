class features {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  //search feature **************************************************************************************************************
  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: 'i',
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  //filter feature **************************************************************************************************************
  filter() {
    const queryCopy = { ...this.queryStr };

    //removing field for category
    const removeFields = ['keyword', 'page', 'limit'];
    removeFields.forEach((key) => delete queryCopy[key]);

    //gt = greater than ||  gte = greater than or equal
    //lt = lesser than  ||  lte = lesser than or equal
    //filters for price, rating etc
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  //pagination feature **************************************************************************************************************
  pagination(resPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;

    const skip = resPerPage * (currentPage - 1);

    this.query = this.query.limit(resPerPage).skip(skip);

    return this;
  }
}

module.exports = features;
