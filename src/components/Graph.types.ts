export interface IndexedGraphNode {
    index: number;
    name: string;
    isFolder: boolean;
    initialDepth: number;
    parentIndex?: number;
}

export interface OptimizedGraphData {
    nodes: IndexedGraphNode[];
    hierarchicalLinks: [number, number][];
    backlinks: [number, number][];
    rootIndex: number;
}

interface NodeKeyMap {
    index: "i";
    name: "n";
    isFolder: "f";
    initialDepth: "d";
    parentIndex: "p";
}

interface DataKeyMap {
    nodes: "n";
    hierarchicalLinks: "h";
    backlinks: "b";
    rootIndex: "r";
}

export type CompressedIndexedGraphNode = {
    [K in keyof IndexedGraphNode as NodeKeyMap[K]]: IndexedGraphNode[K];
};

export type CompressedOptimizedGraphData = {
    [K in keyof OptimizedGraphData as DataKeyMap[K]]: OptimizedGraphData[K];
};

/**
 * Converts full format to compressed format for serialization
 */
export function compressGraphData(
    data: OptimizedGraphData,
): CompressedOptimizedGraphData {
    return {
        n: data.nodes.map((node) => ({
            i: node.index,
            n: node.name,
            f: node.isFolder,
            d: node.initialDepth,
            ...(node.parentIndex !== undefined && { p: node.parentIndex }),
        })),
        h: data.hierarchicalLinks,
        b: data.backlinks,
        r: data.rootIndex,
    };
}

/**
 * Converts compressed format back to full format on client side
 */
export function decompressGraphData(
    data: CompressedOptimizedGraphData,
): OptimizedGraphData {
    return {
        nodes: data.n.map((node) => ({
            index: node.i,
            name: node.n,
            isFolder: node.f,
            initialDepth: node.d,
            ...(node.p !== undefined && { parentIndex: node.p }),
        })),
        hierarchicalLinks: data.h,
        backlinks: data.b,
        rootIndex: data.r,
    };
}
