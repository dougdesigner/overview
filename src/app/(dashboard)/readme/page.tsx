import fs from "fs"
import path from "path"
import { ReadmeContent } from "./ReadmeContent"

export default function ReadmePage() {
  const readme = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8")

  return (
    <main>
      <ReadmeContent content={readme} />
    </main>
  )
}
