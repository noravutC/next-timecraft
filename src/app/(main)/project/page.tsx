'use client';

import { Board } from './_components/board';
import { ProjectToolsLayout } from './project-layout';

export default function ProjectsContent() {
  return (
    <ProjectToolsLayout>
      <Board />
    </ProjectToolsLayout>
  );
}
