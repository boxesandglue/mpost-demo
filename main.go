//go:build js && wasm

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"syscall/js"

	"github.com/boxesandglue/mpgo/draw"
	"github.com/boxesandglue/mpgo/mp"
	"github.com/boxesandglue/mpgo/svg"
)

// SVG circle helper - creates a proper SVG circle element
func svgCircle(cx, cy, r float64, fill, stroke string, strokeWidth float64) string {
	return fmt.Sprintf(`<circle cx="%.2f" cy="%.2f" r="%.2f" fill="%s" stroke="%s" stroke-width="%.2f"/>`,
		cx, cy, r, fill, stroke, strokeWidth)
}

// PointConstraint defines a positional constraint for a point
type PointConstraint struct {
	Type string   `json:"type"`           // "midpoint", "between", "intersection"
	RefA int      `json:"refA"`           // first reference point index
	RefB int      `json:"refB"`           // second reference point index
	T    *float64 `json:"t,omitempty"`    // interpolation parameter for "between"
	RefC *int     `json:"refC,omitempty"` // third reference point index for "intersection"
	RefD *int     `json:"refD,omitempty"` // fourth reference point index for "intersection"
}

// Point represents a point with optional direction and tension settings
type Point struct {
	X            float64          `json:"x"`
	Y            float64          `json:"y"`
	InDirection  *float64         `json:"inDirection,omitempty"`  // incoming direction (nil = auto)
	OutDirection *float64         `json:"outDirection,omitempty"` // outgoing direction (nil = auto)
	InCurl       *float64         `json:"inCurl,omitempty"`       // incoming curl (nil = auto, alternative to direction)
	OutCurl      *float64         `json:"outCurl,omitempty"`      // outgoing curl (nil = auto, alternative to direction)
	Tension      float64          `json:"tension"`                // default 1.0
	IsLine       bool             `json:"isLine"`                 // true = straight line to this point
	IsReference  bool             `json:"isReference"`            // true = reference only, not part of the path
	Constraint   *PointConstraint `json:"constraint,omitempty"`   // positional constraint (nil = free point)
}

// PathConfig holds the configuration for path generation
type PathConfig struct {
	Points             []Point `json:"points"`
	Closed             bool    `json:"closed"`
	StrokeWidth        float64 `json:"strokeWidth"`
	StrokeColor        string  `json:"strokeColor"`
	ShowPoints         bool    `json:"showPoints"`
	ShowControlPoints  bool    `json:"showControlPoints"`
	ShowTicks          bool    `json:"showTicks"`
	TickCount          int     `json:"tickCount"`
	SelectedPointIndex int     `json:"selectedPointIndex"`
	CanvasWidth        float64 `json:"canvasWidth"`
	CanvasHeight       float64 `json:"canvasHeight"`
}

// svgDiamond creates a diamond-shaped SVG marker for constrained points
func svgDiamond(cx, cy, size float64, fill, stroke string, strokeWidth float64) string {
	return fmt.Sprintf(`<polygon points="%.2f,%.2f %.2f,%.2f %.2f,%.2f %.2f,%.2f" fill="%s" stroke="%s" stroke-width="%.2f"/>`,
		cx, cy-size, cx+size, cy, cx, cy+size, cx-size, cy, fill, stroke, strokeWidth)
}

// resolveConstraints uses the draw.Context solver to compute constrained point positions.
// Returns an error string if the system is unsolvable, or empty string on success.
func resolveConstraints(points []Point) string {
	hasConstraints := false
	for _, pt := range points {
		if pt.Constraint != nil {
			hasConstraints = true
			break
		}
	}
	if !hasConstraints {
		return ""
	}

	ctx := draw.NewContext()
	vars := make([]*draw.Var, len(points))

	// Create variables: known for free points, unknown for constrained
	for i, pt := range points {
		if pt.Constraint == nil {
			vars[i] = ctx.Known(pt.X, pt.Y)
		} else {
			vars[i] = ctx.Unknown()
		}
	}

	// Add constraints
	for i, pt := range points {
		if pt.Constraint == nil {
			continue
		}
		c := pt.Constraint
		n := len(points)

		switch c.Type {
		case "midpoint":
			if c.RefA < 0 || c.RefA >= n || c.RefB < 0 || c.RefB >= n {
				return fmt.Sprintf("point %d: invalid reference indices", i)
			}
			ctx.MidPoint(vars[i], vars[c.RefA], vars[c.RefB])
		case "between":
			if c.RefA < 0 || c.RefA >= n || c.RefB < 0 || c.RefB >= n {
				return fmt.Sprintf("point %d: invalid reference indices", i)
			}
			t := 0.5
			if c.T != nil {
				t = *c.T
			}
			ctx.Between(vars[i], vars[c.RefA], vars[c.RefB], t)
		case "intersection":
			if c.RefA < 0 || c.RefA >= n || c.RefB < 0 || c.RefB >= n {
				return fmt.Sprintf("point %d: invalid reference indices", i)
			}
			if c.RefC == nil || c.RefD == nil || *c.RefC < 0 || *c.RefC >= n || *c.RefD < 0 || *c.RefD >= n {
				return fmt.Sprintf("point %d: invalid intersection reference indices", i)
			}
			err := ctx.Intersection(vars[i], vars[c.RefA], vars[c.RefB], vars[*c.RefC], vars[*c.RefD])
			if err != nil {
				return fmt.Sprintf("point %d: %s", i, err.Error())
			}
		default:
			return fmt.Sprintf("point %d: unknown constraint type %q", i, c.Type)
		}
	}

	if err := ctx.Solve(); err != nil {
		return "constraint solve failed: " + err.Error()
	}

	// Write resolved positions back
	for i, pt := range points {
		if pt.Constraint != nil {
			x, y := vars[i].XY()
			points[i].X = x
			points[i].Y = y
		}
	}

	return ""
}

func generateSVG(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return js.ValueOf(`{"error": "missing config argument"}`)
	}

	configJSON := args[0].String()
	var config PathConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return js.ValueOf(`{"error": "invalid JSON: ` + err.Error() + `"}`)
	}

	if len(config.Points) < 2 {
		return js.ValueOf(`{"error": "need at least 2 points"}`)
	}

	// Resolve constraints before anything else
	if errMsg := resolveConstraints(config.Points); errMsg != "" {
		return js.ValueOf(`{"error": "` + errMsg + `"}`)
	}

	// Set defaults
	if config.StrokeWidth == 0 {
		config.StrokeWidth = 2
	}
	if config.StrokeColor == "" {
		config.StrokeColor = "#2563eb"
	}

	// Canvas dimensions for viewBox
	canvasW := config.CanvasWidth
	canvasH := config.CanvasHeight
	if canvasW == 0 {
		canvasW = 800
	}
	if canvasH == 0 {
		canvasH = 600
	}

	// Transform coordinates from world space (centered, Y-up) to SVG space (top-left, Y-down)
	// Do this BEFORE building the path so the solver works in SVG coordinates
	halfW := canvasW / 2
	halfH := canvasH / 2
	toSVGx := func(wx float64) float64 { return wx + halfW }
	toSVGy := func(wy float64) float64 { return halfH - wy }
	// Flip angle for Y-down coordinate system
	flipAngle := func(angle float64) float64 { return -angle }

	// Filter out reference-only points for path building
	var pathPoints []Point
	for _, pt := range config.Points {
		if !pt.IsReference {
			pathPoints = append(pathPoints, pt)
		}
	}

	// Build SVG content
	var svgContent bytes.Buffer

	// Only build path if there are enough non-reference points
	if len(pathPoints) >= 2 {
		builder := draw.NewPath()
		builder.MoveTo(mp.P(toSVGx(pathPoints[0].X), toSVGy(pathPoints[0].Y)))

		if pathPoints[0].OutCurl != nil {
			builder.WithOutgoingCurl(*pathPoints[0].OutCurl)
		} else if pathPoints[0].OutDirection != nil {
			builder.WithDirection(flipAngle(*pathPoints[0].OutDirection))
		}
		if pathPoints[0].Tension != 0 && pathPoints[0].Tension != 1 {
			builder.WithTension(pathPoints[0].Tension)
		}

		for i := 1; i < len(pathPoints); i++ {
			pt := pathPoints[i]
			px, py := toSVGx(pt.X), toSVGy(pt.Y)
			if pt.IsLine {
				builder.LineTo(mp.P(px, py))
			} else {
				if pt.Tension != 0 && pt.Tension != 1 {
					builder.WithTension(pt.Tension)
				}
				if pt.InCurl != nil {
					builder.WithIncomingCurl(*pt.InCurl)
				} else if pt.InDirection != nil {
					builder.WithIncomingDirection(flipAngle(*pt.InDirection))
				}
				builder.CurveTo(mp.P(px, py))
			}
			if pt.OutCurl != nil {
				builder.WithOutgoingCurl(*pt.OutCurl)
			} else if pt.OutDirection != nil {
				builder.WithDirection(flipAngle(*pt.OutDirection))
			}
		}

		if config.Closed {
			if len(pathPoints) > 0 && pathPoints[0].IsLine {
				builder.LineTo(mp.P(toSVGx(pathPoints[0].X), toSVGy(pathPoints[0].Y)))
			}
			builder.Close()
		}

		builder.WithStrokeColor(mp.ColorCSS(config.StrokeColor))
		builder.WithStrokeWidth(config.StrokeWidth)

		path, err := builder.Solve()
		if err != nil {
			return js.ValueOf(`{"error": "solve failed: ` + err.Error() + `"}`)
		}

		pathData := svg.PathToSVG(path)
		fmt.Fprintf(&svgContent, `<path d="%s" fill="none" stroke="%s" stroke-width="%.2f" stroke-linecap="round" stroke-linejoin="round"/>`,
			pathData, config.StrokeColor, config.StrokeWidth)

		// Tick marks
		if config.ShowTicks && path != nil {
			tickCount := config.TickCount
			if tickCount <= 0 {
				tickCount = 10
			}
			numSegments := len(pathPoints) - 1
			if config.Closed {
				numSegments = len(pathPoints)
			}
			maxT := float64(numSegments)
			tickLength := config.StrokeWidth * 4
			tickWidth := config.StrokeWidth * 1.0

			for i := 0; i < tickCount; i++ {
				var t float64
				if tickCount == 1 {
					t = maxT / 2
				} else {
					t = (float64(i) / float64(tickCount-1)) * maxT
				}
				ptX, ptY := path.PointOf(mp.Number(t))
				dirX, dirY := path.DirectionOf(mp.Number(t))
				dirLen := math.Sqrt(float64(dirX*dirX) + float64(dirY*dirY))
				if dirLen < 0.0001 {
					continue
				}
				perpX := -float64(dirY) / dirLen
				perpY := float64(dirX) / dirLen
				halfLen := tickLength * 0.5
				x1 := float64(ptX) - perpX*halfLen
				y1 := float64(ptY) - perpY*halfLen
				x2 := float64(ptX) + perpX*halfLen
				y2 := float64(ptY) + perpY*halfLen
				fmt.Fprintf(&svgContent,
					`<line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f" stroke="#6366f1" stroke-width="%.2f" stroke-linecap="round"/>`,
					x1, y1, x2, y2, tickWidth)
			}
		}

		// Control points and lines
		if config.ShowControlPoints && path != nil && path.Head != nil {
			controlLineWidth := config.StrokeWidth * 0.5
			dashOn := config.StrokeWidth * 2
			dashOff := config.StrokeWidth * 1.5
			k := path.Head
			for {
				next := k.Next
				if next == nil {
					break
				}
				ctrl1X, ctrl1Y := k.RightX, k.RightY
				ctrl2X, ctrl2Y := next.LeftX, next.LeftY
				fmt.Fprintf(&svgContent,
					`<path d="M %.2f %.2f L %.2f %.2f L %.2f %.2f L %.2f %.2f" fill="none" stroke="#9ca3af" stroke-width="%.2f" stroke-dasharray="%.2f %.2f"/>`,
					k.XCoord, k.YCoord, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, next.XCoord, next.YCoord,
					controlLineWidth, dashOn, dashOff)
				k = next
				if k == path.Head || k.RType == mp.KnotEndpoint {
					break
				}
			}
		}
	}

	// Add point markers if requested (always, including reference points)
	if config.ShowPoints {
		// Scale handle size based on stroke width
		handleRadius := config.StrokeWidth * 1.5
		handleBorder := config.StrokeWidth * 0.5
		selectionRingRadius := config.StrokeWidth * 3.0
		selectionRingWidth := config.StrokeWidth * 0.6

		for i, pt := range config.Points {
			// Transform world coords to SVG coords
			px, py := toSVGx(pt.X), toSVGy(pt.Y)

			// Draw selection ring first (behind the point)
			if i == config.SelectedPointIndex {
				fmt.Fprintf(&svgContent,
					`<circle cx="%.2f" cy="%.2f" r="%.2f" fill="none" stroke="#2563eb" stroke-width="%.2f"/>`,
					px, py, selectionRingRadius, selectionRingWidth)
			}

			if pt.Constraint != nil {
				// Constrained point: diamond shape in amber
				svgContent.WriteString(svgDiamond(px, py, handleRadius*1.3, "#f59e0b", "white", handleBorder))
			} else if pt.IsReference {
				// Reference-only point: hollow circle with dashed outline
				fmt.Fprintf(&svgContent,
					`<circle cx="%.2f" cy="%.2f" r="%.2f" fill="none" stroke="#9ca3af" stroke-width="%.2f" stroke-dasharray="%.1f %.1f"/>`,
					px, py, handleRadius, handleBorder*1.5, handleRadius*0.8, handleRadius*0.5)
			} else {
				// Free path point: solid circle
				color := "#3b82f6"
				if i == 0 {
					color = "#22c55e"
				} else if i == len(config.Points)-1 && !config.Closed {
					color = "#ef4444"
				}
				svgContent.WriteString(svgCircle(px, py, handleRadius, color, "white", handleBorder))
			}
		}
	}

	// Build final SVG string
	svgStr := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="%.0f" height="%.0f" viewBox="0 0 %.0f %.0f">%s</svg>`,
		canvasW, canvasH, canvasW, canvasH, svgContent.String())

	// Debug: log the first 500 chars of SVG
	debugSVG := svgStr
	if len(debugSVG) > 500 {
		debugSVG = debugSVG[:500]
	}

	// Build resolved points array for JS to update constrained point positions
	type resolvedPoint struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	}
	resolved := make([]resolvedPoint, len(config.Points))
	for i, pt := range config.Points {
		resolved[i] = resolvedPoint{X: pt.X, Y: pt.Y}
	}

	result := map[string]any{
		"svg":            svgStr,
		"debug":          debugSVG,
		"resolvedPoints": resolved,
	}
	resultJSON, _ := json.Marshal(result)
	return js.ValueOf(string(resultJSON))
}

// getPathInfo returns information about the solved path (control points, etc.)
func getPathInfo(this js.Value, args []js.Value) any {
	if len(args) < 1 {
		return js.ValueOf(`{"error": "missing config argument"}`)
	}

	configJSON := args[0].String()
	var config PathConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return js.ValueOf(`{"error": "invalid JSON"}`)
	}

	if len(config.Points) < 2 {
		return js.ValueOf(`{"error": "need at least 2 points"}`)
	}

	// Build the path (coordinates are in MetaPost style: centered, Y-up)
	builder := draw.NewPath()
	builder.MoveTo(mp.P(config.Points[0].X, config.Points[0].Y))

	if config.Points[0].OutDirection != nil {
		builder.WithDirection(*config.Points[0].OutDirection)
	}
	if config.Points[0].Tension != 0 && config.Points[0].Tension != 1 {
		builder.WithTension(config.Points[0].Tension)
	}

	for i := 1; i < len(config.Points); i++ {
		pt := config.Points[i]
		if pt.IsLine {
			builder.LineTo(mp.P(pt.X, pt.Y))
		} else {
			if pt.Tension != 0 && pt.Tension != 1 {
				builder.WithTension(pt.Tension)
			}
			if pt.InDirection != nil {
				builder.WithIncomingDirection(*pt.InDirection)
			}
			builder.CurveTo(mp.P(pt.X, pt.Y))
		}
		if pt.OutDirection != nil {
			builder.WithDirection(*pt.OutDirection)
		}
	}

	if config.Closed {
		if len(config.Points) > 0 && config.Points[0].IsLine {
			builder.LineTo(mp.P(config.Points[0].X, config.Points[0].Y))
		}
		builder.Close()
	}

	path, err := builder.Solve()
	if err != nil {
		return js.ValueOf(`{"error": "solve failed"}`)
	}

	// Extract control points
	type SegmentInfo struct {
		Start    [2]float64 `json:"start"`
		Ctrl1    [2]float64 `json:"ctrl1"`
		Ctrl2    [2]float64 `json:"ctrl2"`
		End      [2]float64 `json:"end"`
	}

	var segments []SegmentInfo
	if path != nil && path.Head != nil {
		k := path.Head
		for {
			next := k.Next
			if next == nil {
				break
			}
			segments = append(segments, SegmentInfo{
				Start: [2]float64{k.XCoord, k.YCoord},
				Ctrl1: [2]float64{k.RightX, k.RightY},
				Ctrl2: [2]float64{next.LeftX, next.LeftY},
				End:   [2]float64{next.XCoord, next.YCoord},
			})
			k = next
			if k == path.Head || k.RType == mp.KnotEndpoint {
				break
			}
		}
	}

	result := map[string]any{
		"segments": segments,
	}
	resultJSON, _ := json.Marshal(result)
	return js.ValueOf(string(resultJSON))
}

func main() {
	c := make(chan struct{})

	js.Global().Set("mpgoGenerateSVG", js.FuncOf(generateSVG))
	js.Global().Set("mpgoGetPathInfo", js.FuncOf(getPathInfo))

	<-c
}
