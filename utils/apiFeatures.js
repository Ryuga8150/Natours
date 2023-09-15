class APIFeatures {
  //using only query here not finding the query here
  //coz want to make it useful at other places also
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1 A) FILTERING
    const queryObj = { ...this.queryString }; //trick: to make a new object
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //1 B)ADVANCED FILTERING

    //breaking tours into query then awaiting later becuase we need to perform operations
    let queryStr = JSON.stringify(queryObj);
    //with replaceALL not working

    //the first parameter is called something  ---->CHECK!!!!!!
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    //let query = Tour.find(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }
  sort() {
    if (this.queryString.sort) {
      //If we have two sorts
      //then it will be an array not a string thus we cannot use split
      //as split is for strings not for arrays
      //console.log(this.queryString.sort);
      //Thus this is the situation in which attackers can take advantage of

      //using hpp
      //will ake into considerations only the last one

      const sortBy = this.queryString.sort.split(',').join(' ');
      //console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); //same like sort
    } else {
      this.query = this.query.select('-__v'); //this is for excluding
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    //no results is enough for the user to understand this

    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('The PAge does not exist');
    // }
    return this;
  }
}
module.exports = APIFeatures;
