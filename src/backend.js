exports.httpHandler = {
  endpoints: [
    {
      method: "GET",
      path: "health",
      handle: async function (ctx) {
        ctx.response.json({
          status: "ok",
          timestamp: new Date().toISOString(),
        });
      },
    },
  ],
};
