// import { getAllProjects } from "@/actions/project";
// import NotFound from "@/components/global/not-found";
// import Projects from "@/components/global/projects";
// import React from "react";

// type Props = {};

// const Page = async (props: Props) => {
//   const allprojects = await getAllProjects();
//   return (
//     <div className="flex w-full flex-col gap-6 relative p-4 md:p-0">
//       <div className="flex flex-col-reverse items-start w-full gap-6 sm:flex-row sm:justify-between sm:items-center">
//         <div className="flex flex-col items-start">
//           <h1 className="text-2xl font-semibold dark:text-primary backdrop-blur-lg">
//             Projects
//           </h1>
//           <p className="text-slate-500 font-normal dark:text-slate-400">
//             All of your work in one place
//           </p>
//         </div>
//       </div>
//       {allprojects.data && allprojects.data.length > 0 ? (
//         <Projects projects={allprojects.data} />
//       ) : (
//         <NotFound />
//       )}
//     </div>
//   );
// };

// export default Page;

import React from "react";
import { getAllProjects } from "../../../../../actions/project";
import NotFound from "../../../../../components/global/not-found/index";
import Projects from "../../../../../components/global/projects/index";

const Page = async () => {
  const allProjects = await getAllProjects();
  return (
    <div className="flex w-full flex-col gap-6 relative p-4 md:p-0">
      <div className="flex flex-col-reverse items-start w-full gap-6 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-semibold dark:text-primary backdrop-blur-lg">
            Projects
          </h1>
          <p className="text-slate-500 font-normal dark:text-slate-400">
            All of your work in one place
          </p>
        </div>
      </div>

      {allProjects.data && allProjects.data.length > 0 ? (
        <Projects projects={allProjects.data} />
      ) : (
        <NotFound />
      )}
    </div>
  );
};

export default Page;
