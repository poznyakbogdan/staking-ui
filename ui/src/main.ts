import { registerHandlers } from "./handlers";

registerHandlers();

$(
    function () {
        $("#tabs").tabs();
        $("body button").button();
    }
);