import { drag, type D3DragEvent } from "d3-drag";
import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceRadial,
    forceSimulation,
    type Simulation,
    type SimulationLinkDatum,
    type SimulationNodeDatum,
} from "d3-force";
import { select, type Selection } from "d3-selection";
import {
    zoom,
    zoomIdentity,
    type D3ZoomEvent,
    type ZoomBehavior,
} from "d3-zoom";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "preact/hooks";

interface NodeData extends SimulationNodeDatum {
    id: string;
    name: string;
    initialDepth: number;
    isLeaf: boolean;
    relativeDepth: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

interface LinkData extends SimulationLinkDatum<NodeData> {
    source: string | NodeData;
    target: string | NodeData;
    isBacklink: boolean;
}

interface HierarchicalNode {
    name: string;
    path: string;
    children?: HierarchicalNode[];
    backlinks?: string[];
}

interface ProcessedGraphData {
    nodes: NodeData[];
    links: Array<
        Omit<LinkData, "source" | "target"> & { source: string; target: string }
    >;
    hierarchyAdjacencyMap: { [key: string]: string[] };
    fullAdjacencyMap: { [key: string]: string[] };
}

const BASE_RADIUS = 10;
const VISUAL_RADIUS_SCALE_FACTOR = 0.85;
const MIN_VISUAL_RADIUS = 3;
const RADIAL_INCREMENT = 80;
const FOCUS_TRANSITION_DURATION = 750;
const RADIAL_STRENGTH = 0.6;
const ROOT_NODE_ID = "/";
const SIM_ALPHA_DECAY = 0.018;
const SIM_CHARGE_STRENGTH = -150;
const DRAG_ALPHA_TARGET = 0.1;

const hierarchicalData: HierarchicalNode = {
    name: "Blog Root",
    path: "/",
    children: [
        {
            name: "notes",
            path: "/notes",
            children: [
                {
                    name: "daily",
                    path: "/notes/daily",
                    children: [
                        {
                            name: "2025-04-23.md",
                            path: "/notes/daily/2025-04-23.md",
                            backlinks: ["/notes/ideas.md"],
                        },
                        {
                            name: "2025-04-22.md",
                            path: "/notes/daily/2025-04-22.md",
                        },
                    ],
                },
                {
                    name: "ideas.md",
                    path: "/notes/ideas.md",
                    backlinks: [
                        "/programming/tools.md",
                        "/notes/daily/2025-04-23.md",
                    ],
                },
                {
                    name: "research",
                    path: "/notes/research",
                    children: [
                        {
                            name: "d3-examples.txt",
                            path: "/notes/research/d3-examples.txt",
                        },
                        {
                            name: "astro-links.url",
                            path: "/notes/research/astro-links.url",
                        },
                    ],
                },
            ],
        },
        {
            name: "programming",
            path: "/programming",
            children: [
                {
                    name: "language",
                    path: "/programming/language",
                    children: [
                        {
                            name: "python_tricks.py",
                            path: "/programming/language/python_tricks.py",
                        },
                        {
                            name: "js_snippets.js",
                            path: "/programming/language/js_snippets.js",
                        },
                    ],
                },
                {
                    name: "webdev",
                    path: "/programming/webdev",
                    children: [
                        {
                            name: "css_grid.html",
                            path: "/programming/webdev/css_grid.html",
                        },
                        {
                            name: "tailwind_config.js",
                            path: "/programming/webdev/tailwind_config.js",
                        },
                    ],
                },
                {
                    name: "tools.md",
                    path: "/programming/tools.md",
                    backlinks: ["/notes/ideas.md"],
                },
            ],
        },
        {
            name: "personal",
            path: "/personal",
            children: [
                {
                    name: "foo",
                    path: "/personal/foo",
                    children: [
                        {
                            name: "journal_entry_1.txt",
                            path: "/personal/foo/journal_entry_1.txt",
                        },
                    ],
                },
                {
                    name: "bar",
                    path: "/personal/bar",
                    children: [
                        {
                            name: "recipe_ideas.md",
                            path: "/personal/bar/recipe_ideas.md",
                        },
                    ],
                },
                { name: "thoughts.md", path: "/personal/thoughts.md" },
            ],
        },
        { name: "about.md", path: "/about.md" },
        { name: "contact.html", path: "/contact.html" },
    ],
};

function calculateVisualNodeRadius(node: NodeData): number {
    const depth = isFinite(node.relativeDepth) ? node.relativeDepth : 5;
    const depthFactor = Math.pow(VISUAL_RADIUS_SCALE_FACTOR, depth);
    return Math.max(MIN_VISUAL_RADIUS, BASE_RADIUS * depthFactor);
}

function getLinkKey(
    link:
        | LinkData
        | (Omit<LinkData, "source" | "target"> & {
              source: string;
              target: string;
          }),
): string {
    const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
        typeof link.target === "string" ? link.target : link.target.id;
    return `${sourceId}-${targetId}`;
}

function ForceGraph() {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
        null,
    );
    const simulationRef = useRef<Simulation<NodeData, LinkData> | null>(null);
    const nodeElementsRef = useRef<Selection<
        SVGGElement,
        NodeData,
        SVGGElement,
        unknown
    > | null>(null);
    const linkElementsRef = useRef<Selection<
        SVGLineElement,
        LinkData,
        SVGGElement,
        unknown
    > | null>(null);
    const nodeGroupRef = useRef<Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    > | null>(null);
    const linkGroupRef = useRef<Selection<
        SVGGElement,
        unknown,
        null,
        undefined
    > | null>(null);

    const [focusedNodeId, setFocusedNodeId] = useState<string>(ROOT_NODE_ID);
    const [dimensions, setDimensions] = useState<{
        width: number;
        height: number;
    }>({ width: 0, height: 0 });

    const precalculatedGraphData = useMemo((): ProcessedGraphData => {
        console.log("Processing hierarchical data...");
        type BuildNode = Omit<NodeData, "x" | "y" | "vx" | "vy" | "index"> & {
            backlinksTemp?: string[];
        };
        const buildNodes: BuildNode[] = [];
        const buildLinks: Array<
            Omit<LinkData, "source" | "target"> & {
                source: string;
                target: string;
            }
        > = [];
        const buildHierarchyAdjacencyMap = new Map<string, Set<string>>();
        const buildFullAdjacencyMap = new Map<string, Set<string>>();
        const buildNodeMap = new Map<string, BuildNode>();

        function traverseBuild(
            node: HierarchicalNode,
            parentPath: string | null = null,
            depth = 0,
        ) {
            const nodeId = node.path;
            if (!nodeId) return;
            const newNode: BuildNode = {
                id: nodeId,
                name: node.name,
                initialDepth: depth,
                isLeaf: !node.children || node.children.length === 0,
                backlinksTemp: node.backlinks || [],
                relativeDepth: Infinity,
                fx: null,
                fy: null,
            };
            buildNodes.push(newNode);
            buildNodeMap.set(nodeId, newNode);
            buildHierarchyAdjacencyMap.set(nodeId, new Set());
            buildFullAdjacencyMap.set(nodeId, new Set());
            if (parentPath !== null) {
                const link = {
                    source: parentPath,
                    target: nodeId,
                    isBacklink: false,
                };
                buildLinks.push(link);
                buildHierarchyAdjacencyMap.get(parentPath)?.add(nodeId);
                buildHierarchyAdjacencyMap.get(nodeId)?.add(parentPath);
                buildFullAdjacencyMap.get(parentPath)?.add(nodeId);
                buildFullAdjacencyMap.get(nodeId)?.add(parentPath);
            }
            if (node.children) {
                node.children.forEach((child) =>
                    traverseBuild(child, nodeId, depth + 1),
                );
            }
        }
        traverseBuild(hierarchicalData);

        buildNodes.forEach((node) => {
            (node.backlinksTemp || []).forEach((targetPath) => {
                if (buildNodeMap.has(targetPath)) {
                    const linkExists = buildLinks.some(
                        (l) =>
                            (l.source === node.id && l.target === targetPath) ||
                            (l.source === targetPath && l.target === node.id),
                    );
                    if (!linkExists) {
                        const link = {
                            source: node.id,
                            target: targetPath,
                            isBacklink: true,
                        };
                        buildLinks.push(link);
                        buildFullAdjacencyMap.get(node.id)?.add(targetPath);
                        buildFullAdjacencyMap.get(targetPath)?.add(node.id);
                    } else {
                        buildFullAdjacencyMap.get(node.id)?.add(targetPath);
                        buildFullAdjacencyMap.get(targetPath)?.add(node.id);
                    }
                }
            });
            delete node.backlinksTemp;
        });

        const finalHierarchyAdjacencyMap: { [key: string]: string[] } = {};
        buildHierarchyAdjacencyMap.forEach(
            (v, k) => (finalHierarchyAdjacencyMap[k] = Array.from(v)),
        );
        const finalFullAdjacencyMap: { [key: string]: string[] } = {};
        buildFullAdjacencyMap.forEach(
            (v, k) => (finalFullAdjacencyMap[k] = Array.from(v)),
        );
        console.log(
            "Data processed:",
            buildNodes.length,
            "nodes,",
            buildLinks.length,
            "links",
        );

        const finalNodes = buildNodes as NodeData[];

        return {
            nodes: finalNodes,
            links: buildLinks,
            hierarchyAdjacencyMap: finalHierarchyAdjacencyMap,
            fullAdjacencyMap: finalFullAdjacencyMap,
        };
    }, []);

    const nodeMap = useMemo(
        () =>
            new Map(
                precalculatedGraphData.nodes.map((node) => [node.id, node]),
            ),
        [precalculatedGraphData.nodes],
    );

    const calculateRelativeDepth = useCallback(
        (nodes: NodeData[], startNodeId: string) => {
            console.log(
                "Calculating HIERARCHICAL relative depth from:",
                startNodeId,
            );
            const nodeMapForDepth = new Map(nodes.map((n) => [n.id, n]));
            nodes.forEach((n) => (n.relativeDepth = Infinity));
            const startNode = nodeMapForDepth.get(startNodeId);
            if (!startNode) {
                console.warn("Start node not found:", startNodeId);
                return;
            }
            startNode.relativeDepth = 0;
            const queue = [startNodeId];
            const visited = new Set([startNodeId]);
            let head = 0;
            while (head < queue.length) {
                const currentId = queue[head++];
                const currentNode = nodeMapForDepth.get(currentId);
                if (!currentNode) continue;
                const neighbors =
                    precalculatedGraphData.hierarchyAdjacencyMap[currentId] ||
                    [];
                neighbors.forEach((neighborId) => {
                    if (!visited.has(neighborId)) {
                        visited.add(neighborId);
                        const neighborNode = nodeMapForDepth.get(neighborId);
                        if (neighborNode) {
                            // Ensure relativeDepth is treated as a number
                            const currentDepth =
                                typeof currentNode.relativeDepth === "number"
                                    ? currentNode.relativeDepth
                                    : 0;
                            neighborNode.relativeDepth = currentDepth + 1;
                            queue.push(neighborId);
                        } else {
                            console.warn(
                                "Hierarchical neighbor not found:",
                                neighborId,
                            );
                        }
                    }
                });
            }
            console.log("Hierarchical depth calculation complete.");
        },
        [precalculatedGraphData.hierarchyAdjacencyMap],
    );

    useEffect(() => {
        if (
            !svgRef.current ||
            !containerRef.current ||
            dimensions.width === 0 ||
            dimensions.height === 0
        )
            return;
        console.log("Initial D3 Setup Effect, Dimensions:", dimensions);

        const svg = select(svgRef.current);
        const { width, height } = dimensions;

        let simNodes: NodeData[] = precalculatedGraphData.nodes.map((n) => ({
            ...n,
        }));
        let simLinks: LinkData[] = precalculatedGraphData.links.map(
            (l: (typeof precalculatedGraphData.links)[0]) => ({ ...l }),
        ) as LinkData[];

        const simNodeMap = new Map(simNodes.map((node) => [node.id, node]));

        calculateRelativeDepth(simNodes, focusedNodeId);

        const simulation = forceSimulation<NodeData, LinkData>(simNodes)
            .force(
                "link",
                forceLink<NodeData, LinkData>(simLinks)
                    .id((d) => d.id)
                    .distance((d) => {
                        const targetId =
                            typeof d.target === "string"
                                ? d.target
                                : d.target.id;
                        const targetNode = simNodeMap.get(targetId);
                        return d.isBacklink ? 70 : targetNode?.isLeaf ? 45 : 65;
                    })
                    .strength((d) => (d.isBacklink ? 0.2 : 0.6)),
            )
            .force("charge", forceManyBody().strength(SIM_CHARGE_STRENGTH))
            .force("center", forceCenter(width / 2, height / 2))
            .force(
                "collide",

                forceCollide<NodeData>()
                    .radius(BASE_RADIUS + 3)
                    .iterations(2),
            )
            .force(
                "radial",

                forceRadial<NodeData>()
                    .radius((d) =>
                        isFinite(d.relativeDepth)
                            ? d.relativeDepth * RADIAL_INCREMENT
                            : Math.max(width, height) * 1.5,
                    )
                    .strength((d) =>
                        isFinite(d.relativeDepth) ? RADIAL_STRENGTH : 0.05,
                    )
                    .x(width / 2)
                    .y(height / 2),
            )
            .alphaDecay(SIM_ALPHA_DECAY);

        simulationRef.current = simulation;

        linkGroupRef.current = svg.append("g").attr("class", "links");
        nodeGroupRef.current = svg.append("g").attr("class", "nodes");

        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 8])
            .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
                if (nodeGroupRef.current)
                    nodeGroupRef.current.attr(
                        "transform",
                        event.transform.toString(),
                    );
                if (linkGroupRef.current)
                    linkGroupRef.current.attr(
                        "transform",
                        event.transform.toString(),
                    );
            });
        svg.call(zoomBehavior);
        svg.on("dblclick.zoom", () => {
            svg.transition()
                .duration(750)
                .call(zoomBehavior.transform, zoomIdentity);
        });
        zoomBehaviorRef.current = zoomBehavior;

        linkElementsRef.current = linkGroupRef.current
            .selectAll<SVGLineElement, LinkData>("line")
            .data(simLinks, getLinkKey)
            .join("line")
            .attr(
                "class",
                (d: LinkData) =>
                    `transition-opacity duration-200 ${d.isBacklink ? "link--backlink stroke-red-400 stroke-opacity-80 stroke-[1px]" : "link--hierarchy stroke-gray-400 stroke-opacity-60 stroke-[1.5px]"}`,
            );

        nodeElementsRef.current = nodeGroupRef.current
            .selectAll<SVGGElement, NodeData>("g.node")
            .data(simNodes, (d: NodeData) => d.id)
            .join("g")
            .attr("class", "node");

        nodeElementsRef.current
            .append("circle")
            .attr(
                "class",
                (d: NodeData) =>
                    `stroke-gray-600 stroke-[1.5px] transition-all duration-300 ease-out cursor-pointer ${d.isLeaf ? "fill-green-200" : "fill-blue-400"}`,
            )
            .attr("r", (d: NodeData) => calculateVisualNodeRadius(d));

        nodeElementsRef.current
            .append("text")
            .attr(
                "class",
                "text-[10px] fill-gray-700 pointer-events-none select-none",
            )
            .attr("dy", "0.31em")
            .attr("y", (d: NodeData) => calculateVisualNodeRadius(d) + 5)
            .text((d: NodeData) => d.name);

        const ticked = () => {
            if (
                !simulationRef.current ||
                simulationRef.current.alpha() < simulationRef.current.alphaMin()
            )
                return;
            const nodePadding = 5;
            simulation.nodes().forEach((d: NodeData) => {
                if (d.fx === null && d.fy === null) {
                    const radius = BASE_RADIUS;
                    const currentX = typeof d.x === "number" ? d.x : 0;
                    const currentY = typeof d.y === "number" ? d.y : 0;
                    d.x = Math.max(
                        radius + nodePadding,
                        Math.min(width - radius - nodePadding, currentX),
                    );
                    d.y = Math.max(
                        radius + nodePadding,
                        Math.min(height - radius - nodePadding, currentY),
                    );
                }
            });
            if (linkElementsRef.current) {
                linkElementsRef.current
                    .attr("x1", (d: LinkData) => (d.source as NodeData).x ?? 0)
                    .attr("y1", (d: LinkData) => (d.source as NodeData).y ?? 0)
                    .attr("x2", (d: LinkData) => (d.target as NodeData).x ?? 0)
                    .attr("y2", (d: LinkData) => (d.target as NodeData).y ?? 0);
            }
            if (nodeElementsRef.current) {
                nodeElementsRef.current.attr(
                    "transform",
                    (d: NodeData) => `translate(${d.x ?? 0},${d.y ?? 0})`,
                );
            }
        };
        simulation.on("tick", ticked);

        return () => {
            console.log("Cleaning up initial D3 setup");
            simulationRef.current?.stop();
            if (svgRef.current) {
                const svgSelection = select(svgRef.current);
                svgSelection.on(".zoom", null);
                svgSelection.on("dblclick.zoom", null);
                svgSelection.selectAll("*").remove();
            }
            simulationRef.current = null;
            zoomBehaviorRef.current = null;
            nodeElementsRef.current = null;
            linkElementsRef.current = null;
            nodeGroupRef.current = null;
            linkGroupRef.current = null;
        };
    }, [
        dimensions,
        precalculatedGraphData,
        calculateRelativeDepth,
        focusedNodeId,
    ]);

    useEffect(() => {
        if (
            !svgRef.current ||
            !simulationRef.current ||
            !nodeElementsRef.current ||
            !linkElementsRef.current ||
            !zoomBehaviorRef.current ||
            !tooltipRef.current ||
            dimensions.width === 0
        ) {
            console.log("Waiting for refs/simulation in focus effect...");
            return;
        }
        console.log("Running Focus/Interaction Effect for:", focusedNodeId);

        const svg = select(svgRef.current);
        const simulation = simulationRef.current;
        const nodeElements = nodeElementsRef.current;
        const linkElements = linkElementsRef.current;
        const zoomBehavior = zoomBehaviorRef.current;
        const tooltip = select(tooltipRef.current);
        const { width, height } = dimensions;

        const currentNodes = simulation.nodes();
        const currentNodeMap = new Map(currentNodes.map((n) => [n.id, n]));

        calculateRelativeDepth(currentNodes, focusedNodeId);

        const dragBehavior = drag<SVGGElement, NodeData>()
            .on(
                "start",
                function (
                    event: D3DragEvent<SVGGElement, NodeData, any>,
                    d: NodeData,
                ) {
                    if (!event.active)
                        simulation.alphaTarget(DRAG_ALPHA_TARGET).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                    select(this)
                        .select("circle")
                        .classed("cursor-grabbing", true)
                        .classed("cursor-pointer", false);
                },
            )
            .on(
                "drag",
                function (
                    event: D3DragEvent<SVGGElement, NodeData, any>,
                    d: NodeData,
                ) {
                    d.fx = event.x;
                    d.fy = event.y;
                },
            )
            .on(
                "end",
                function (
                    event: D3DragEvent<SVGGElement, NodeData, any>,
                    d: NodeData,
                ) {
                    if (!event.active) simulation.alphaTarget(0);
                    if (d.id !== focusedNodeId) {
                        d.fx = null;
                        d.fy = null;
                    }
                    select(this)
                        .select("circle")
                        .classed("cursor-grabbing", false)
                        .classed("cursor-pointer", true);
                },
            );

        const handleMouseOver = (event: MouseEvent, d: NodeData) => {
            if (!tooltipRef.current) return;
            select(tooltipRef.current)
                .transition()
                .duration(200)
                .style("opacity", 0.9);
            select(tooltipRef.current)
                .html(
                    `${d.name}<br><small class='text-gray-400'>${d.id}</small>`,
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 28 + "px");
            select(event.currentTarget as SVGGElement)
                .select("circle")
                .classed("stroke-[3px]", true);
            linkElements?.classed("opacity-10", (l: LinkData) => {
                const sourceId =
                    typeof l.source === "string" ? l.source : l.source.id;
                const targetId =
                    typeof l.target === "string" ? l.target : l.target.id;
                return !(sourceId === d.id || targetId === d.id);
            });
        };
        const handleMouseOut = (event: MouseEvent, d: NodeData) => {
            if (!tooltipRef.current) return;
            select(tooltipRef.current)
                .transition()
                .duration(500)
                .style("opacity", 0);
            select(event.currentTarget as SVGGElement)
                .select("circle")
                .classed("stroke-[3px]", false);
            linkElements?.classed("opacity-10", false);
        };
        const nodeClicked = (event: MouseEvent, d: NodeData) => {
            event.stopPropagation();
            const newFocusId = d.id === focusedNodeId ? ROOT_NODE_ID : d.id;
            console.log("Node clicked, new focus:", newFocusId);
            const targetNode = currentNodeMap.get(newFocusId);
            if (targetNode && zoomBehavior) {
                const targetX =
                    typeof targetNode.x === "number" ? targetNode.x : width / 2;
                const targetY =
                    typeof targetNode.y === "number"
                        ? targetNode.y
                        : height / 2;
                if (isFinite(targetX) && isFinite(targetY)) {
                    svg.transition()
                        .duration(FOCUS_TRANSITION_DURATION)
                        .call(zoomBehavior.translateTo, targetX, targetY);
                } else {
                    console.warn(
                        "Target node has invalid position:",
                        targetNode,
                    );
                    svg.transition()
                        .duration(FOCUS_TRANSITION_DURATION)
                        .call(zoomBehavior.translateTo, width / 2, height / 2);
                }
            }
            if (targetNode) {
                const finalX =
                    typeof targetNode.x === "number" ? targetNode.x : width / 2;
                const finalY =
                    typeof targetNode.y === "number"
                        ? targetNode.y
                        : height / 2;
                targetNode.fx = finalX;
                targetNode.fy = finalY;
            }
            if (focusedNodeId !== newFocusId) {
                const oldFocusNode = currentNodeMap.get(focusedNodeId);
                if (oldFocusNode) {
                    oldFocusNode.fx = null;
                    oldFocusNode.fy = null;
                }
            }
            setFocusedNodeId(newFocusId);
        };
        const svgClicked = (event: MouseEvent) => {
            if (event.target === svgRef.current) {
                console.log("SVG background clicked, resetting focus to root");
                const rootNode = currentNodeMap.get(ROOT_NODE_ID);
                const targetX =
                    typeof rootNode?.x === "number" ? rootNode.x : width / 2;
                const targetY =
                    typeof rootNode?.y === "number" ? rootNode.y : height / 2;
                if (isFinite(targetX) && isFinite(targetY)) {
                    svg.transition()
                        .duration(FOCUS_TRANSITION_DURATION)
                        .call(zoomBehavior.translateTo, targetX, targetY);
                } else {
                    console.warn(
                        "Root node position invalid, panning to center",
                    );
                    svg.transition()
                        .duration(FOCUS_TRANSITION_DURATION)
                        .call(zoomBehavior.translateTo, width / 2, height / 2);
                }
                const currentFocusNode = currentNodeMap.get(focusedNodeId);
                if (currentFocusNode) {
                    currentFocusNode.fx = null;
                    currentFocusNode.fy = null;
                }
                setFocusedNodeId(ROOT_NODE_ID);
            }
        };

        nodeElements
            .call(dragBehavior)
            .on("click", nodeClicked)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut);
        svg.on("click", svgClicked);

        console.log("Applying focus styles for:", focusedNodeId);
        nodeElements.attr(
            "class",
            (d: NodeData) =>
                `node ${d.isLeaf ? "node--leaf" : "node--internal"} ${d.id === focusedNodeId ? "node--focused" : ""}`,
        );

        nodeElements
            .select<SVGCircleElement>("circle")
            .attr(
                "class",
                (d: NodeData) =>
                    `stroke-gray-600 stroke-[1.5px] transition-all duration-300 ease-out cursor-pointer ${d.isLeaf ? "fill-green-200" : "fill-blue-400"} ${d.id === focusedNodeId ? "stroke-red-500 stroke-[3px]" : ""}`,
            )
            .transition()
            .duration(FOCUS_TRANSITION_DURATION / 2)
            .attr("r", (d: NodeData) => calculateVisualNodeRadius(d));

        nodeElements
            .select<SVGTextElement>("text")
            .transition()
            .duration(FOCUS_TRANSITION_DURATION / 2)
            .attr("y", (d: NodeData) => calculateVisualNodeRadius(d) + 5);

        return () => {
            console.log(
                "Cleaning up focus/interaction listeners for:",
                focusedNodeId,
            );
            if (nodeElementsRef.current) {
                nodeElementsRef.current
                    .on(".drag", null)
                    .on("click", null)
                    .on("mouseover", null)
                    .on("mouseout", null);
            }
            if (svgRef.current) {
                select(svgRef.current).on("click", null);
            }
        };
    }, [
        focusedNodeId,
        dimensions,
        precalculatedGraphData,
        calculateRelativeDepth,
    ]);

    useEffect(() => {
        console.log("Setting up ResizeObserver");
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                setDimensions((prevDims) => {
                    if (
                        prevDims.width !== width ||
                        prevDims.height !== height
                    ) {
                        console.log("Resize detected:", width, height);
                        return { width, height };
                    }
                    return prevDims;
                });
            }
        });
        const currentContainer = containerRef.current;
        resizeObserver.observe(currentContainer);

        const initialWidth = currentContainer.clientWidth;
        const initialHeight = currentContainer.clientHeight;
        if (initialWidth > 0 && initialHeight > 0) {
            setDimensions((prevDims) => {
                if (
                    prevDims.width !== initialWidth ||
                    prevDims.height !== initialHeight
                ) {
                    return { width: initialWidth, height: initialHeight };
                }
                return prevDims;
            });
        }

        return () => {
            console.log("Disconnecting ResizeObserver");
            resizeObserver.unobserve(currentContainer);
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div
            id="tree-container"
            ref={containerRef}
            class="relative h-full max-h-[90vh] w-full max-w-[90vw] cursor-default overflow-hidden rounded-lg bg-white shadow-md"
        >
            <svg
                id="force-graph-svg"
                ref={svgRef}
                width="100%"
                height="100%"
            ></svg>
            <div
                ref={tooltipRef}
                class="pointer-events-none absolute z-10 rounded-md border-0 bg-gray-700 px-[10px] py-[6px] text-center text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200"
            ></div>
        </div>
    );
}

export default ForceGraph;
