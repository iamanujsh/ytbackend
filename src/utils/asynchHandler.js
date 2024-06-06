const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};

// const asyncHandler = (fn) => {
//   async (req, res, next) => {
//     try {
//       fn(req, res, next);
//     } catch (error) {
//       console
//         .log(error.code || 500)
//         .json({ success: false, message: error.message });
//     }
//   };
// };

export { asyncHandler };
