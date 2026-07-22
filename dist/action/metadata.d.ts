import type { ArtifactRelationType, ArtifactRole, ArtifactState, DeclaredProducer } from "./types.js";
export interface DeclaredMetadata {
    role?: ArtifactRole;
    state?: ArtifactState;
    scope?: string[];
    owner?: string;
    lastVerified?: string;
    producer?: DeclaredProducer;
    relations?: Array<{
        targetPath: string;
        type: ArtifactRelationType;
    }>;
}
export declare function readDeclaredMetadata(filePath: string): Promise<DeclaredMetadata>;
