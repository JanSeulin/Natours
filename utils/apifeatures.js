class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // FILTERING
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1b) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    // gte, gt, lte/ lt === greater than or equal, greater than, lesser than or equal, lesser than
    // below regular expression  /\b(gte|gt|lte|lt)\b/g finds all the occurrences of the items in the parentheses in the query and add a $ before it so it can be leveraged in the find method
    // /b means that it needs to be exactly this value (ex. it'll not consider a match if the sequence is part of a word)
    // /g means globally, without it it'll replace only the first occurrence of all the possible occurences of the items in question
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  // SORTING
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      // mongoose expects all the values separated in a string by space, that's why the above code

      this.query = this.query.sort(sortBy);
      // sort('price ratingsAverage')
    } else {
      // adding a default sort --- in this case by the newest created
      this.query = this.query.sort('-createdAt _id'); // It's a good idea to have the default sorting together with an unique identifier to not generate duplicate erros. That's why it's added _id in this case. In the example here, since all the data was imported to the database at the same time, the pagination below was not working properly. Adding the unique identifier fixed that.
    }

    return this;
  }

  // FIELD LIMITING
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // - minus in the case of select will EXCLUDE the field instead of including it
    }

    return this;
  }

  // PAGINATION
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // Ex:?page=2&limit=10, 1 to 10, page 1 --- 11 - 20 = page 2 etc etc
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
