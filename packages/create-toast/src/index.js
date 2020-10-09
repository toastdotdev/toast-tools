const { Command, flags } = require("@oclif/command");
const degit = require("degit");
const { makeStarterURL } = require("./utils");

class CreateToastCommand extends Command {
  async run() {
    const { flags, args } = this.parse(CreateToastCommand);

    let starter = "";
    let destination = "";
    if (!args.starter && !args.output_directory) {
      this.error("Must provided at least a destination directory");
      return;
    } else if (!args.output_directory && args.starter) {
      starter = makeStarterURL();
      destination = args.starter;
    } else if (args.starter && args.output_directory) {
      starter = makeStarterURL(args.starter);
      destination = args.output_directory;
    }
    this.log(`putting ${starter} in ${destination}`);
    const emitter = degit(starter);

    emitter.on("info", (info) => {
      console.log(info.message);
    });

    emitter.clone(destination).then(() => {
      console.log("done");
    });
  }
}

CreateToastCommand.description = `Scaffold a new Toast site

A single argument is treated as output directory with the default starter:

    create-toast something

Two arguments are treated as <starter-name> and <output-dir>

    create-toast default something

---

## The starter name can be

a single word, which will look for the starter in the toast starters list

    create-toast default my-new-site

a github repo in shorthand form

    create-toast toastdotdev/some-starter my-new-site

a github repo with a subdirectory

    create-toast toastdotdev/starters/minimal my-new-site

a fully qualified path to a git repo

    create-toast git@github.com:user/repo my-new-site
`;
CreateToastCommand.strict = false;
CreateToastCommand.args = [{ name: "starter" }, { name: "output_directory" }];
CreateToastCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: "v" }),
  // add --help flag to show CLI version
  help: flags.help({ char: "h" }),
};

module.exports = CreateToastCommand;
