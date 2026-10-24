// Minimal typings for the parts of the JSTS UMD build we use.
declare module "jsts" {
  export interface Geometry {
    getArea(): number;
    getLength(): number;
    getNumPoints(): number;
    getGeometryType(): string;
    getFactory(): GeometryFactory;
    isEmpty(): boolean;
    isValid(): boolean;
    buffer(distance: number, quadrantSegments?: number): Geometry;
    union(other?: Geometry): Geometry;
  }
  export interface Coordinate {
    x: number;
    y: number;
  }
  export interface GeometryFactory {
    createGeometryCollection(geoms: Geometry[]): Geometry;
    createPolygon(shell: Geometry, holes: Geometry[]): Geometry;
    createLinearRing(coords: Coordinate[]): Geometry;
  }
  const jsts: {
    io: {
      GeoJSONReader: new () => { read(g: GeoJSON.Geometry | object): Geometry };
      GeoJSONWriter: new () => { write(g: Geometry): GeoJSON.Geometry };
    };
    geom: {
      GeometryFactory: new () => GeometryFactory;
      Coordinate: new (x: number, y: number) => Coordinate;
    };
    operation: {
      buffer: { BufferOp: { bufferOp(g: Geometry, distance: number, quadrantSegments?: number): Geometry } };
      union: { UnaryUnionOp: { union(g: Geometry): Geometry } };
    };
  };
  export default jsts;
}
