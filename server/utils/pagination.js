const getPagination = (page, limit) => {
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  return {
    page: pageNumber,
    limit: limitNumber,
    skip
  };
};

const getPaginationMeta = (page, limit, total) => {
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;
  const totalPages = Math.ceil(total / limitNumber);

  return {
    currentPage: pageNumber,
    totalPages,
    totalItems: total,
    itemsPerPage: limitNumber,
    hasNextPage: pageNumber < totalPages,
    hasPrevPage: pageNumber > 1,
    nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
    prevPage: pageNumber > 1 ? pageNumber - 1 : null
  };
};

module.exports = {
  getPagination,
  getPaginationMeta
};