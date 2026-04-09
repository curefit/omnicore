import AppKit
import Foundation

struct CatalogItem {
  let sku: String
  let name: String
  let category: String
  let series: String?
  let imageUrl: String
  let imageUrl2: String
  let specs: String
}

struct AccentPalette {
  let primary: NSColor
  let secondary: NSColor
  let glow: NSColor
}

let outputSize = NSSize(width: 1376, height: 768)

let repoRoot: URL = {
  if CommandLine.arguments.count > 1 {
    return URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
  }
  return URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
}()

let catalogPath = repoRoot.appendingPathComponent("lib/equipment/catalog.ts")
let publicEquipmentDirectory = repoRoot.appendingPathComponent("public/equipment", isDirectory: true)
let outputDirectory = publicEquipmentDirectory.appendingPathComponent("generated", isDirectory: true)

func decodeTypeScriptString(_ value: String) -> String {
  value
    .replacingOccurrences(of: #"\""#, with: "\"")
    .replacingOccurrences(of: #"\\n"#, with: "\n")
}

func extractField(_ name: String, from block: String) -> String? {
  let pattern = "\\b" + NSRegularExpression.escapedPattern(for: name) + #":\s*"((?:\\.|[^"])*)""#
  guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
  let nsBlock = block as NSString
  guard let match = regex.firstMatch(in: block, options: [], range: NSRange(location: 0, length: nsBlock.length)) else {
    return nil
  }
  let range = match.range(at: 1)
  guard range.location != NSNotFound else { return nil }
  return decodeTypeScriptString(nsBlock.substring(with: range))
}

func parseCatalogItems(from source: String) throws -> [CatalogItem] {
  let blockRegex = try NSRegularExpression(pattern: #"\{\s*sku:[\s\S]*?\n\s*\},"#)
  let nsSource = source as NSString
  let matches = blockRegex.matches(in: source, options: [], range: NSRange(location: 0, length: nsSource.length))

  return matches.compactMap { match in
    let block = nsSource.substring(with: match.range)
    guard block.contains("imageUrl:"), block.contains("imageUrl2:"), block.contains("specs:") else {
      return nil
    }

    guard
      let sku = extractField("sku", from: block),
      let name = extractField("name", from: block),
      let category = extractField("category", from: block),
      let imageUrl = extractField("imageUrl", from: block),
      let imageUrl2 = extractField("imageUrl2", from: block),
      let specs = extractField("specs", from: block)
    else {
      return nil
    }

    return CatalogItem(
      sku: sku,
      name: name,
      category: category,
      series: extractField("series", from: block),
      imageUrl: imageUrl,
      imageUrl2: imageUrl2,
      specs: specs
    )
  }
}

func palette(for item: CatalogItem) -> AccentPalette {
  let key = item.series ?? item.category
  switch key {
  case "FLOW":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.30, green: 0.80, blue: 0.95, alpha: 1),
      secondary: NSColor(calibratedRed: 0.10, green: 0.45, blue: 0.75, alpha: 1),
      glow: NSColor(calibratedRed: 0.15, green: 0.65, blue: 0.90, alpha: 0.22)
    )
  case "FLUX":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.94, green: 0.76, blue: 0.36, alpha: 1),
      secondary: NSColor(calibratedRed: 0.68, green: 0.48, blue: 0.16, alpha: 1),
      glow: NSColor(calibratedRed: 0.88, green: 0.68, blue: 0.18, alpha: 0.22)
    )
  case "FUEL":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.89, green: 0.45, blue: 0.25, alpha: 1),
      secondary: NSColor(calibratedRed: 0.60, green: 0.16, blue: 0.10, alpha: 1),
      glow: NSColor(calibratedRed: 0.90, green: 0.35, blue: 0.16, alpha: 0.20)
    )
  case "FORCE":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.88, green: 0.17, blue: 0.22, alpha: 1),
      secondary: NSColor(calibratedRed: 0.52, green: 0.08, blue: 0.11, alpha: 1),
      glow: NSColor(calibratedRed: 0.82, green: 0.15, blue: 0.18, alpha: 0.18)
    )
  case "TREADMILL":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.91, green: 0.22, blue: 0.24, alpha: 1),
      secondary: NSColor(calibratedRed: 0.52, green: 0.08, blue: 0.14, alpha: 1),
      glow: NSColor(calibratedRed: 0.88, green: 0.16, blue: 0.20, alpha: 0.18)
    )
  case "ELLIPTICAL":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.12, green: 0.80, blue: 0.80, alpha: 1),
      secondary: NSColor(calibratedRed: 0.07, green: 0.36, blue: 0.45, alpha: 1),
      glow: NSColor(calibratedRed: 0.10, green: 0.70, blue: 0.74, alpha: 0.18)
    )
  case "BIKE":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.36, green: 0.74, blue: 0.98, alpha: 1),
      secondary: NSColor(calibratedRed: 0.16, green: 0.34, blue: 0.56, alpha: 1),
      glow: NSColor(calibratedRed: 0.28, green: 0.60, blue: 0.92, alpha: 0.18)
    )
  case "HIGH_INTENSITY":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.98, green: 0.62, blue: 0.15, alpha: 1),
      secondary: NSColor(calibratedRed: 0.58, green: 0.28, blue: 0.06, alpha: 1),
      glow: NSColor(calibratedRed: 0.92, green: 0.54, blue: 0.18, alpha: 0.20)
    )
  case "CABLE_FUNCTIONAL":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.30, green: 0.88, blue: 0.62, alpha: 1),
      secondary: NSColor(calibratedRed: 0.10, green: 0.44, blue: 0.28, alpha: 1),
      glow: NSColor(calibratedRed: 0.22, green: 0.76, blue: 0.52, alpha: 0.18)
    )
  case "BENCH":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.78, green: 0.80, blue: 0.88, alpha: 1),
      secondary: NSColor(calibratedRed: 0.38, green: 0.42, blue: 0.52, alpha: 1),
      glow: NSColor(calibratedRed: 0.65, green: 0.70, blue: 0.82, alpha: 0.15)
    )
  case "FREE_WEIGHTS", "KETTLEBELL":
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.98, green: 0.46, blue: 0.16, alpha: 1),
      secondary: NSColor(calibratedRed: 0.62, green: 0.20, blue: 0.07, alpha: 1),
      glow: NSColor(calibratedRed: 0.92, green: 0.42, blue: 0.15, alpha: 0.18)
    )
  default:
    return AccentPalette(
      primary: NSColor(calibratedRed: 0.44, green: 0.74, blue: 0.98, alpha: 1),
      secondary: NSColor(calibratedRed: 0.17, green: 0.32, blue: 0.50, alpha: 1),
      glow: NSColor(calibratedRed: 0.28, green: 0.62, blue: 0.90, alpha: 0.16)
    )
  }
}

func humanizedCategory(_ category: String) -> String {
  category.replacingOccurrences(of: "_", with: " ").capitalized
}

func cleanedTitle(_ item: CatalogItem) -> String {
  var title = item.name
  if let series = item.series {
    let titleSeries = series.prefix(1).uppercased() + series.dropFirst().lowercased()
    title = title.replacingOccurrences(of: " (\(titleSeries) Series)", with: "")
  }
  title = title.replacingOccurrences(of: " (Fuel)", with: "")
  title = title.replacingOccurrences(of: " (Flow)", with: "")
  return title
}

func slug(for sku: String) -> String {
  sku.lowercased().replacingOccurrences(of: "/", with: "-")
}

func sourceImageURL(_ path: String) -> URL {
  let trimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
  return repoRoot.appendingPathComponent("public").appendingPathComponent(trimmed)
}

func aspectFitRect(for imageSize: NSSize, in bounds: NSRect) -> NSRect {
  guard imageSize.width > 0, imageSize.height > 0 else { return bounds }
  let scale = min(bounds.width / imageSize.width, bounds.height / imageSize.height)
  let width = imageSize.width * scale
  let height = imageSize.height * scale
  return NSRect(
    x: bounds.midX - width / 2,
    y: bounds.midY - height / 2,
    width: width,
    height: height
  )
}

func aspectFillRect(for imageSize: NSSize, in bounds: NSRect) -> NSRect {
  guard imageSize.width > 0, imageSize.height > 0 else { return bounds }
  let scale = max(bounds.width / imageSize.width, bounds.height / imageSize.height)
  let width = imageSize.width * scale
  let height = imageSize.height * scale
  return NSRect(
    x: bounds.midX - width / 2,
    y: bounds.midY - height / 2,
    width: width,
    height: height
  )
}

func bodyFont(size: CGFloat, weight: NSFont.Weight = .regular) -> NSFont {
  NSFont.systemFont(ofSize: size, weight: weight)
}

func headlineFont(size: CGFloat) -> NSFont {
  NSFont(name: "AvenirNextCondensed-DemiBold", size: size)
    ?? NSFont(name: "HelveticaNeue-CondensedBold", size: size)
    ?? NSFont.systemFont(ofSize: size, weight: .semibold)
}

func monoFont(size: CGFloat) -> NSFont {
  NSFont(name: "Menlo-Bold", size: size)
    ?? NSFont.monospacedSystemFont(ofSize: size, weight: .bold)
}

func drawRoundedBadge(_ rect: NSRect, fillColor: NSColor, strokeColor: NSColor, text: String, textColor: NSColor) {
  let badge = NSBezierPath(roundedRect: rect, xRadius: rect.height / 2, yRadius: rect.height / 2)
  fillColor.setFill()
  badge.fill()
  strokeColor.setStroke()
  badge.lineWidth = 1
  badge.stroke()

  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = .center
  let attributes: [NSAttributedString.Key: Any] = [
    .font: bodyFont(size: 13, weight: .medium),
    .foregroundColor: textColor,
    .paragraphStyle: paragraph,
  ]
  let textRect = rect.insetBy(dx: 12, dy: 5)
  NSString(string: text).draw(in: textRect, withAttributes: attributes)
}

func drawChip(text: String, at point: NSPoint, palette: AccentPalette) {
  let attributes: [NSAttributedString.Key: Any] = [
    .font: bodyFont(size: 15, weight: .medium),
    .foregroundColor: NSColor(calibratedWhite: 0.92, alpha: 1),
  ]
  let nsText = NSString(string: text)
  let textSize = nsText.size(withAttributes: attributes)
  let rect = NSRect(x: point.x, y: point.y, width: textSize.width + 22, height: 34)
  let path = NSBezierPath(roundedRect: rect, xRadius: 17, yRadius: 17)
  NSColor(calibratedWhite: 0.12, alpha: 0.84).setFill()
  path.fill()
  palette.primary.withAlphaComponent(0.28).setStroke()
  path.lineWidth = 1
  path.stroke()
  nsText.draw(at: NSPoint(x: rect.minX + 11, y: rect.minY + 8), withAttributes: attributes)
}

func drawBrandMark(at point: NSPoint, palette: AccentPalette) {
  let emblemCenter = NSPoint(x: point.x + 24, y: point.y + 20)

  func drawDot(_ offsetX: CGFloat, _ offsetY: CGFloat, color: NSColor, size: CGFloat) {
    color.setFill()
    NSBezierPath(ovalIn: NSRect(
      x: emblemCenter.x + offsetX - size / 2,
      y: emblemCenter.y + offsetY - size / 2,
      width: size,
      height: size
    )).fill()
  }

  func drawStem(_ start: NSPoint, _ end: NSPoint, color: NSColor, width: CGFloat) {
    let path = NSBezierPath()
    path.move(to: start)
    path.line(to: end)
    path.lineWidth = width
    path.lineCapStyle = .round
    color.setStroke()
    path.stroke()
  }

  drawDot(0, 0, color: NSColor(calibratedWhite: 0.98, alpha: 1), size: 6)
  drawDot(0, 12, color: palette.primary, size: 6)
  drawDot(-13, -3, color: NSColor(calibratedWhite: 0.98, alpha: 1), size: 5)
  drawDot(13, -3, color: NSColor(calibratedWhite: 0.98, alpha: 1), size: 5)
  drawDot(-7, -16, color: palette.secondary, size: 5)
  drawDot(8, -16, color: palette.primary, size: 5)

  drawStem(NSPoint(x: emblemCenter.x, y: emblemCenter.y + 4), NSPoint(x: emblemCenter.x, y: emblemCenter.y + 10), color: NSColor(calibratedWhite: 0.96, alpha: 1), width: 2.6)
  drawStem(NSPoint(x: emblemCenter.x - 4, y: emblemCenter.y - 3), NSPoint(x: emblemCenter.x - 11, y: emblemCenter.y - 1), color: NSColor(calibratedWhite: 0.96, alpha: 1), width: 2.6)
  drawStem(NSPoint(x: emblemCenter.x + 4, y: emblemCenter.y - 3), NSPoint(x: emblemCenter.x + 11, y: emblemCenter.y - 1), color: NSColor(calibratedWhite: 0.96, alpha: 1), width: 2.6)
  drawStem(NSPoint(x: emblemCenter.x - 2, y: emblemCenter.y - 6), NSPoint(x: emblemCenter.x - 6, y: emblemCenter.y - 13), color: palette.secondary, width: 2.6)
  drawStem(NSPoint(x: emblemCenter.x + 2, y: emblemCenter.y - 6), NSPoint(x: emblemCenter.x + 6, y: emblemCenter.y - 13), color: palette.primary, width: 2.6)

  let wordAttributes: [NSAttributedString.Key: Any] = [
    .font: headlineFont(size: 30),
    .foregroundColor: NSColor(calibratedWhite: 0.98, alpha: 1),
  ]
  NSString(string: "cult").draw(at: NSPoint(x: point.x + 44, y: point.y + 2), withAttributes: wordAttributes)
}

func backgroundGradient(in rect: NSRect, palette: AccentPalette) {
  let gradient = NSGradient(colors: [
    NSColor(calibratedRed: 0.03, green: 0.04, blue: 0.05, alpha: 1),
    NSColor(calibratedRed: 0.06, green: 0.07, blue: 0.09, alpha: 1),
  ])!
  gradient.draw(in: rect, angle: 315)

  let vignette = NSBezierPath(rect: rect)
  NSColor(calibratedWhite: 0.01, alpha: 0.38).setStroke()
  vignette.lineWidth = 3
  vignette.stroke()

  palette.glow.withAlphaComponent(0.24).setFill()
  NSBezierPath(ovalIn: NSRect(x: rect.maxX - 420, y: rect.midY - 160, width: 360, height: 360)).fill()
  palette.secondary.withAlphaComponent(0.20).setFill()
  NSBezierPath(ovalIn: NSRect(x: rect.minX - 80, y: rect.maxY - 180, width: 280, height: 280)).fill()

  let sweep = NSBezierPath()
  sweep.move(to: NSPoint(x: rect.minX + 180, y: rect.maxY))
  sweep.line(to: NSPoint(x: rect.minX + 360, y: rect.maxY))
  sweep.line(to: NSPoint(x: rect.minX + 120, y: rect.minY))
  sweep.line(to: NSPoint(x: rect.minX, y: rect.minY))
  sweep.close()
  palette.primary.withAlphaComponent(0.05).setFill()
  sweep.fill()
}

func drawTextBlock(for item: CatalogItem, palette: AccentPalette, variant: Int) {
  let badgeLabel = item.series.map { "\($0) SERIES" } ?? humanizedCategory(item.category).uppercased()
  drawRoundedBadge(
    NSRect(x: 72, y: 650, width: 178, height: 34),
    fillColor: palette.primary.withAlphaComponent(0.10),
    strokeColor: palette.primary.withAlphaComponent(0.40),
    text: badgeLabel,
    textColor: palette.primary
  )

  let skuAttributes: [NSAttributedString.Key: Any] = [
    .font: monoFont(size: 18),
    .foregroundColor: NSColor(calibratedWhite: 0.80, alpha: 1),
    .kern: 2.2,
  ]
  NSString(string: item.sku).draw(at: NSPoint(x: 72, y: 606), withAttributes: skuAttributes)

  let titleFontSize: CGFloat = item.name.count > 30 ? 54 : 60
  let titleParagraph = NSMutableParagraphStyle()
  titleParagraph.lineBreakMode = .byWordWrapping
  titleParagraph.alignment = .left
  let titleAttributes: [NSAttributedString.Key: Any] = [
    .font: headlineFont(size: titleFontSize),
    .foregroundColor: NSColor(calibratedWhite: 0.97, alpha: 1),
    .paragraphStyle: titleParagraph,
    .kern: 0.4,
  ]
  NSString(string: cleanedTitle(item))
    .draw(in: NSRect(x: 68, y: 372, width: 430, height: 220), withAttributes: titleAttributes)

  let subtitleAttributes: [NSAttributedString.Key: Any] = [
    .font: bodyFont(size: 18, weight: .regular),
    .foregroundColor: NSColor(calibratedWhite: 0.72, alpha: 1),
  ]
  NSString(string: "Cultsport Commercial Equipment").draw(at: NSPoint(x: 72, y: 340), withAttributes: subtitleAttributes)

  let specParts = item.specs.components(separatedBy: " | ")
  let chips = variant == 1 ? Array(specParts.prefix(2)) : Array(specParts.suffix(min(2, specParts.count)))
  var chipX: CGFloat = 72
  for chip in chips {
    drawChip(text: chip, at: NSPoint(x: chipX, y: 110), palette: palette)
    let chipWidth = NSString(string: chip).size(withAttributes: [
      .font: bodyFont(size: 15, weight: .medium)
    ]).width + 34
    chipX += chipWidth + 12
  }

  let accentPath = NSBezierPath()
  accentPath.move(to: NSPoint(x: 72, y: 90))
  accentPath.line(to: NSPoint(x: 238, y: 90))
  accentPath.lineWidth = 4
  palette.primary.setStroke()
  accentPath.stroke()

  let noteAttributes: [NSAttributedString.Key: Any] = [
    .font: bodyFont(size: 14, weight: .medium),
    .foregroundColor: NSColor(calibratedWhite: 0.56, alpha: 1),
    .kern: 1.3,
  ]
  NSString(string: "CURATED FOR PREMIUM GYM SPACES").draw(at: NSPoint(x: 72, y: 58), withAttributes: noteAttributes)
}

func drawForegroundImage(_ image: NSImage, item: CatalogItem, variant: Int, palette: AccentPalette) {
  let rect: NSRect
  if variant == 1 {
    rect = NSRect(x: 430, y: 48, width: 880, height: 640)
  } else {
    rect = NSRect(x: 350, y: 18, width: 970, height: 720)
  }

  let imageRect = variant == 1 ? aspectFitRect(for: image.size, in: rect) : aspectFillRect(for: image.size, in: rect)
  let shadow = NSShadow()
  shadow.shadowBlurRadius = variant == 1 ? 34 : 20
  shadow.shadowColor = NSColor.black.withAlphaComponent(0.55)
  shadow.shadowOffset = NSSize(width: 0, height: variant == 1 ? -16 : -8)

  NSGraphicsContext.current?.saveGraphicsState()
  shadow.set()

  let transform = NSAffineTransform()
  let pivot = NSPoint(x: imageRect.midX, y: imageRect.midY)
  transform.translateX(by: pivot.x, yBy: pivot.y)
  let direction: CGFloat = (abs(item.sku.hashValue) % 2 == 0) ? 1 : -1
  transform.rotate(byDegrees: variant == 1 ? 0.8 * direction : 0.25 * direction)
  transform.translateX(by: -pivot.x, yBy: -pivot.y)
  transform.concat()

  image.draw(in: imageRect, from: .zero, operation: .sourceOver, fraction: 0.98)
  NSGraphicsContext.current?.restoreGraphicsState()

  if variant == 2 {
    let rightFade = NSGradient(colors: [
      NSColor(calibratedWhite: 0.01, alpha: 0.0),
      NSColor(calibratedWhite: 0.01, alpha: 0.44),
    ])!
    rightFade.draw(in: NSRect(x: 250, y: 0, width: 1126, height: 768), angle: 0)
  }

  let spotlight = NSBezierPath(ovalIn: NSRect(x: rect.minX + 190, y: rect.maxY - 190, width: 180, height: 180))
  palette.primary.withAlphaComponent(variant == 1 ? 0.09 : 0.06).setFill()
  spotlight.fill()
}

func topOverlayForVariant2() {
  let gradient = NSGradient(colors: [
    NSColor(calibratedWhite: 0.02, alpha: 0.82),
    NSColor(calibratedWhite: 0.02, alpha: 0.00),
  ])!
  gradient.draw(in: NSRect(x: 0, y: 500, width: outputSize.width, height: 268), angle: 90)

  let leftPanel = NSBezierPath(roundedRect: NSRect(x: 46, y: 44, width: 430, height: 680), xRadius: 28, yRadius: 28)
  NSColor(calibratedWhite: 0.03, alpha: 0.82).setFill()
  leftPanel.fill()
  NSColor(calibratedWhite: 0.16, alpha: 0.65).setStroke()
  leftPanel.lineWidth = 1.2
  leftPanel.stroke()
}

func renderImage(for item: CatalogItem, variant: Int) throws {
  guard let source = NSImage(contentsOf: sourceImageURL(variant == 1 ? item.imageUrl : item.imageUrl2)) else {
    throw NSError(domain: "equipment-image-generator", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing source image for \(item.sku)"])
  }

  let palette = palette(for: item)
  let canvas = NSImage(size: outputSize)
  canvas.lockFocus()

  backgroundGradient(in: NSRect(origin: .zero, size: outputSize), palette: palette)
  if variant == 2 {
    topOverlayForVariant2()
  }
  drawForegroundImage(source, item: item, variant: variant, palette: palette)
  drawTextBlock(for: item, palette: palette, variant: variant)
  drawBrandMark(at: NSPoint(x: 72, y: 694), palette: palette)

  canvas.unlockFocus()

  guard
    let tiffData = canvas.tiffRepresentation,
    let rep = NSBitmapImageRep(data: tiffData),
    let jpegData = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.92])
  else {
    throw NSError(domain: "equipment-image-generator", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to encode \(item.sku) variant \(variant)"])
  }

  let destination = outputDirectory.appendingPathComponent("\(slug(for: item.sku))-\(variant).jpg")
  try jpegData.write(to: destination)
}

let fileManager = FileManager.default
try fileManager.createDirectory(at: outputDirectory, withIntermediateDirectories: true, attributes: nil)

let source = try String(contentsOf: catalogPath, encoding: .utf8)
let items = try parseCatalogItems(from: source)
if items.isEmpty {
  throw NSError(domain: "equipment-image-generator", code: 3, userInfo: [NSLocalizedDescriptionKey: "No catalog items were parsed from \(catalogPath.path)"])
}

for item in items {
  try renderImage(for: item, variant: 1)
  try renderImage(for: item, variant: 2)
}

print("Generated \(items.count * 2) equipment images in \(outputDirectory.path)")
