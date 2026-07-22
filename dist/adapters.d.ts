import type { ArtifactContribution, ArtifactRole, DetectionResult, FrameworkAdapter, RepositoryContext } from "./types.js";
type Rule = {
    patterns: string[];
    role: ArtifactRole;
};
declare class PatternAdapter implements FrameworkAdapter {
    id: string;
    private markers;
    private rules;
    private rootMarker;
    constructor(id: string, markers: string[], rules: Rule[], rootMarker: string);
    detect(context: RepositoryContext): Promise<DetectionResult>;
    discover(context: RepositoryContext): Promise<ArtifactContribution>;
}
export declare const specKitAdapter: PatternAdapter;
export declare const openSpecAdapter: PatternAdapter;
export declare const kiroAdapter: PatternAdapter;
export declare const genericAdapter: FrameworkAdapter;
export declare const BUILTIN_ADAPTERS: FrameworkAdapter[];
export {};
