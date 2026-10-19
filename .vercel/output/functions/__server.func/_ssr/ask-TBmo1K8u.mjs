import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ask-TBmo1K8u.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var askGrok_createServerFn_handler = createServerRpc({
	id: "a96c6497cea2cdb49d52d9e1537c3c8fc1aec6dbca47e007211cb86bf0dff857",
	name: "askGrok",
	filename: "src/lib/folio/ask.ts"
}, (opts) => askGrok.__executeServer(opts));
var askGrok = createServerFn({ method: "POST" }).validator((input) => input).handler(askGrok_createServerFn_handler, async ({ data }) => {
	const { runAsk } = await import("./grok.server-DKSuO2EM.mjs");
	return runAsk(data);
});
//#endregion
export { askGrok_createServerFn_handler };
