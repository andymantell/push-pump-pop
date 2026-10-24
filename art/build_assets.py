"""Builds the game's models in headless Blender and exports them as glTF.

Run with:  python art/build_assets.py   (needs the `bpy` package)

Conventions (Blender is Z-up, three.js Y-up; the glTF exporter converts):
  * Blender -Y becomes three.js +Z, the direction the skater faces (towards the camera).
  * Every skater part has its origin at its joint and hangs down -Z, matching src/skater.ts.
  * Props have their origin at ground level.
"""
import math
import os
import bpy
import bmesh
from mathutils import Vector, Matrix

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'models')
os.makedirs(OUT, exist_ok=True)

MATS = {}


def mat(name, rgb):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*srgb_to_linear(rgb), 1)
    bsdf.inputs['Roughness'].default_value = 0.8
    MATS[name] = m
    return m


def srgb_to_linear(rgb):
    def f(c):
        c = c / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(c) for c in rgb)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()


def finish(obj, material, smooth=True, subdiv=0):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    if subdiv:
        mod = obj.modifiers.new('sub', 'SUBSURF')
        mod.levels = subdiv
        mod.render_levels = subdiv
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier='sub')
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    else:
        for p in obj.data.polygons:
            p.use_smooth = False
    return obj


def apply_tf(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def cube(material, size, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, subdiv=0, smooth=True, segs=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    apply_tf(o)
    if bevel:
        m = o.modifiers.new('bev', 'BEVEL')
        m.width = bevel
        m.segments = segs
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='bev')
    return finish(o, material, smooth, subdiv)


def sphere(material, r, loc=(0, 0, 0), scale=(1, 1, 1), segs=20, rings=12, smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=segs, ring_count=rings)
    o = bpy.context.object
    o.scale = scale
    apply_tf(o)
    return finish(o, material, smooth)


def ico(material, r, loc=(0, 0, 0), scale=(1, 1, 1), sub=1, smooth=False, jitter=0.0, seed=0):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, location=(0, 0, 0), subdivisions=sub)
    o = bpy.context.object
    if jitter:
        import random
        rnd = random.Random(seed)
        for v in o.data.vertices:
            v.co *= 1 + (rnd.random() - 0.5) * jitter
    o.scale = scale
    o.location = loc
    apply_tf(o)
    return finish(o, material, smooth)


def cyl(material, r, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=16, r2=None, smooth=True, bevel=0.0):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object
    if bevel:
        m = o.modifiers.new('bev', 'BEVEL')
        m.width = bevel
        m.segments = 2
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='bev')
    o = finish(o, material, smooth)
    if smooth:
        # Keep cylinder caps crisp.
        m = o.modifiers.new('ws', 'WEIGHTED_NORMAL') if hasattr(o.modifiers, 'new') else None
    return o


def capsule(material, r_top, r_bot, length, loc=(0, 0, 0), scale=(1, 1, 1), segs=16):
    """Tapered capsule from loc down to loc - length on Z."""
    bm = bmesh.new()
    rings = 10
    profile = []
    # top hemisphere
    for i in range(rings // 2 + 1):
        a = (math.pi / 2) * (1 - i / (rings // 2))
        profile.append((r_top * math.cos(a), -r_top + r_top * math.sin(a) * 1.0 + 0))
    # shift: top cap centre at -r_top
    profile = [(x, z) for x, z in profile]
    body_top = -r_top
    body_bot = -(length - r_bot)
    prof = []
    for i in range(rings // 2 + 1):
        a = (math.pi / 2) * (i / (rings // 2))
        prof.append((r_top * math.sin(a), body_top + r_top * math.cos(a)))
    for i in range(rings // 2 + 1):
        a = (math.pi / 2) * (i / (rings // 2))
        prof.append((r_bot * math.cos(a), body_bot - r_bot * math.sin(a)))
    ringsv = []
    for (pr, pz) in prof:
        ring = []
        for s in range(segs):
            t = 2 * math.pi * s / segs
            ring.append(bm.verts.new((pr * math.cos(t), pr * math.sin(t), pz)))
        ringsv.append(ring)
    for a, b in zip(ringsv, ringsv[1:]):
        for s in range(segs):
            bm.faces.new((a[s], a[(s + 1) % segs], b[(s + 1) % segs], b[s]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = bpy.data.meshes.new('cap')
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('cap', me)
    bpy.context.collection.objects.link(o)
    o.scale = scale
    o.location = loc
    apply_tf(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    return finish(o, material, True)


def join(name, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    o.data.name = name
    return o


def export(path, objects=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in (objects or bpy.context.scene.objects):
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True,
        export_apply=True, export_yup=True, export_materials='EXPORT',
    )
    print('wrote', path, os.path.getsize(path), 'bytes')


# ---------------------------------------------------------------- skater

def cap_dome(material):
    """Baseball cap crown: the top of a sphere, cut off above the eyes."""
    o = sphere(material, 0.134, loc=(0, 0, 0.16), scale=(1, 1.03, 1.0), segs=24, rings=16)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    cut = 0.16 + 0.045  # brow line, above the eyes at 0.16
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < cut - 1e-4], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    # Back of the cap sits a little lower than the front.
    for v in o.data.vertices:
        if v.co.y > 0:
            v.co.z -= 0.03 * (v.co.y / 0.134)
    return o


def build_skater():
    reset()
    skin = mat('skin', (240, 192, 154))
    shirt = mat('shirt', (47, 143, 216))
    shirt_dk = mat('shirt_dark', (30, 104, 166))
    pants = mat('pants', (52, 62, 82))
    pants_dk = mat('pants_dark', (38, 45, 60))
    shoe_m = mat('shoe', (245, 245, 240))
    sole = mat('sole', (60, 50, 45))
    lace = mat('shoe_accent', (232, 64, 42))
    cap_m = mat('cap', (232, 64, 42))
    hair = mat('hair', (92, 58, 36))
    eye = mat('eye', (30, 30, 34))

    parts = []

    # Pelvis: centred on the hip line, belt and seat.
    p = [
        capsule(pants, 0.15, 0.15, 0.26, loc=(0, 0, 0.13), scale=(1.15, 0.85, 1)),
        cyl(pants_dk, 0.165, 0.05, loc=(0, 0, 0.1), verts=24, r2=None),
    ]
    p[1].scale = (1.12, 0.84, 1)
    apply_tf(p[1])
    parts.append(join('pelvis', p))

    # Torso: hoodie-ish shirt from waist (0) to neck (0.5), shoulders at 0.44.
    t = [
        capsule(shirt, 0.19, 0.16, 0.55, loc=(0, 0, 0.55), scale=(1.2, 0.78, 1)),
        cyl(shirt_dk, 0.17, 0.06, loc=(0, 0, 0.03), verts=24),
        sphere(shirt, 0.08, loc=(0.2, 0, 0.43), segs=12, rings=8),
        sphere(shirt, 0.08, loc=(-0.2, 0, 0.43), segs=12, rings=8),
        cyl(skin, 0.05, 0.08, loc=(0, 0, 0.5), verts=12),
    ]
    t[1].scale = (1.12, 0.8, 1)
    apply_tf(t[1])
    parts.append(join('torso', t))

    # Head: neck pivot at 0, skull centred at 0.16, cap with brim facing -Y.
    h = [
        sphere(skin, 0.125, loc=(0, 0, 0.16), scale=(0.95, 1, 1.05), segs=24, rings=16),
        cap_dome(cap_m),
        cube(cap_m, (0.17, 0.12, 0.018), loc=(0, -0.155, 0.19), rot=(math.radians(-8), 0, 0), bevel=0.008),
        sphere(hair, 0.05, loc=(0.1, 0.04, 0.13), segs=10, rings=6),
        sphere(hair, 0.05, loc=(-0.1, 0.04, 0.13), segs=10, rings=6),
        sphere(eye, 0.016, loc=(0.042, -0.115, 0.16), segs=10, rings=6),
        sphere(eye, 0.016, loc=(-0.042, -0.115, 0.16), segs=10, rings=6),
        sphere(skin, 0.022, loc=(0, -0.125, 0.135), segs=10, rings=6),
        sphere(skin, 0.03, loc=(0.122, 0, 0.15), scale=(0.5, 1, 1.2), segs=10, rings=6),
        sphere(skin, 0.03, loc=(-0.122, 0, 0.15), scale=(0.5, 1, 1.2), segs=10, rings=6),
    ]
    parts.append(join('head', h))

    # Arms: sleeve on the upper arm, forearm with a hand.
    for s in ('L', 'R'):
        parts.append(join(f'upperArm_{s}', [
            capsule(shirt, 0.058, 0.05, 0.31, loc=(0, 0, 0.02)),
        ]))
        parts.append(join(f'forearm_{s}', [
            capsule(skin, 0.045, 0.038, 0.26, loc=(0, 0, 0.0)),
            cyl(shirt_dk, 0.052, 0.04, loc=(0, 0, -0.01), verts=12),
            sphere(skin, 0.055, loc=(0, -0.005, -0.29), scale=(0.75, 0.6, 1), segs=12, rings=8),
        ]))

    # Legs: baggy jeans, cuffs on the shins.
    for s in ('L', 'R'):
        parts.append(join(f'thigh_{s}', [capsule(pants, 0.085, 0.07, 0.47, loc=(0, 0, 0.02))]))
        parts.append(join(f'shin_{s}', [
            capsule(pants, 0.07, 0.072, 0.44, loc=(0, 0, 0.0)),
            cyl(pants_dk, 0.076, 0.05, loc=(0, 0, -0.39), verts=16),
        ]))
        # Shoe: ankle at origin, toes towards -Y (the camera), sole at -0.075.
        parts.append(join(f'shoe_{s}', [
            cube(shoe_m, (0.115, 0.28, 0.075), loc=(0, -0.035, -0.035), bevel=0.025, segs=3),
            cube(sole, (0.12, 0.29, 0.022), loc=(0, -0.035, -0.07), bevel=0.008),
            cube(lace, (0.06, 0.1, 0.02), loc=(0, -0.09, 0.0), bevel=0.008),
            cyl(shoe_m, 0.055, 0.07, loc=(0, 0.03, 0.0), verts=14),
        ]))

    # Deck: origin on the ground under the wheels, deck top at 0.115.
    parts.append(build_board())
    export(os.path.join(OUT, 'skater.glb'), parts)


def build_board():
    deck_m = mat('deck_grip', (34, 34, 38))
    wood = mat('deck_wood', (216, 140, 58))
    graphic = mat('deck_graphic', (232, 64, 42))
    metal = mat('truck', (184, 190, 198))
    wheel_m = mat('wheel', (245, 230, 168))

    # Deck outline: popsicle shape, kicked nose and tail, slight concave.
    L, W, T = 0.8, 0.21, 0.016
    nx, ny = 40, 8
    bm = bmesh.new()
    top, bot = [], []
    for i in range(nx + 1):
        u = i / nx * 2 - 1  # -1..1 along length
        x = u * L / 2
        half = W / 2
        end = max(0.0, abs(u) - 0.78) / 0.22
        width = half * math.sqrt(max(0.0, 1 - end * end)) if end > 0 else half
        width = max(width, 0.004)
        kick = 0.0
        if abs(u) > 0.62:
            k = (abs(u) - 0.62) / 0.38
            kick = 0.07 * k * k
        rt, rb = [], []
        for j in range(ny + 1):
            v = j / ny * 2 - 1
            y = v * width
            concave = 0.006 * (v * v)
            z = 0.1 + kick + concave
            rt.append(bm.verts.new((x, y, z + T / 2)))
            rb.append(bm.verts.new((x, y, z - T / 2)))
        top.append(rt)
        bot.append(rb)
    faces_top, faces_bot = [], []
    for i in range(nx):
        for j in range(ny):
            faces_top.append(bm.faces.new((top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1])))
            faces_bot.append(bm.faces.new((bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j])))
    for i in range(nx):
        bm.faces.new((top[i][0], bot[i][0], bot[i + 1][0], top[i + 1][0]))
        bm.faces.new((top[i][ny], top[i + 1][ny], bot[i + 1][ny], bot[i][ny]))
    for i in (0, nx):
        for j in range(ny):
            f = (top[i][j], top[i][j + 1], bot[i][j + 1], bot[i][j])
            bm.faces.new(f if i == nx else f[::-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        n = f.normal
        f.material_index = 0 if n.z > 0.5 else (1 if n.z < -0.5 else 2)
        c = f.calc_center_median()
        if f.material_index == 1 and abs(c.x) < 0.22:
            f.material_index = 3
    me = bpy.data.meshes.new('deck')
    bm.to_mesh(me)
    bm.free()
    deck = bpy.data.objects.new('deck_body', me)
    bpy.context.collection.objects.link(deck)
    for m in (deck_m, wood, wood, graphic):
        deck.data.materials.append(m)
    for p in deck.data.polygons:
        p.use_smooth = True

    bits = [deck]
    for s in (-1, 1):
        x = s * 0.25
        bits.append(cube(metal, (0.06, 0.06, 0.012), loc=(x, 0, 0.086), bevel=0.004))
        bits.append(cube(metal, (0.035, 0.05, 0.035), loc=(x, 0, 0.065), bevel=0.008))
        bits.append(cube(metal, (0.03, 0.17, 0.024), loc=(x, 0, 0.042), bevel=0.01))
        bits.append(cyl(metal, 0.006, 0.23, loc=(x, 0, 0.03), rot=(math.pi / 2, 0, 0), verts=8))
        for y in (-0.1, 0.1):
            bits.append(cyl(wheel_m, 0.03, 0.034, loc=(x, y, 0.03), rot=(math.pi / 2, 0, 0), verts=20, bevel=0.008))
    return join('deck', bits)


# ---------------------------------------------------------------- props

def build_props():
    reset()
    out = []
    bark = mat('bark', (122, 82, 50))
    leaf = mat('leaf', (63, 154, 69))
    leaf2 = mat('leaf_light', (92, 184, 84))
    leaf3 = mat('leaf_dark', (48, 128, 62))
    rock_m = mat('rock', (150, 152, 156))
    wood = mat('fence_wood', (197, 139, 82))
    wood_dk = mat('fence_wood_dark', (160, 108, 60))
    steel = mat('lamp_steel', (60, 70, 82))
    light = mat('lamp_light', (255, 243, 176))
    cone_m = mat('cone', (255, 122, 26))
    white = mat('white', (245, 245, 245))
    bench_wood = mat('bench_wood', (181, 112, 58))
    iron = mat('iron', (68, 68, 72))

    # Tree: tapered trunk with a couple of branches and a lumpy crown.
    trunk = cyl(bark, 0.22, 2.2, loc=(0, 0, 1.1), r2=0.12, verts=10)
    br1 = cyl(bark, 0.08, 0.9, loc=(0.25, 0, 1.9), rot=(0, math.radians(40), 0), r2=0.04, verts=8)
    br2 = cyl(bark, 0.07, 0.8, loc=(-0.22, 0.05, 2.0), rot=(0, math.radians(-35), 0), r2=0.035, verts=8)
    crown = [
        ico(leaf, 1.25, loc=(0, 0, 3.0), sub=2, jitter=0.25, seed=1, smooth=True),
        ico(leaf2, 0.9, loc=(0.7, -0.3, 3.5), sub=2, jitter=0.25, seed=2, smooth=True),
        ico(leaf3, 0.95, loc=(-0.7, 0.2, 2.8), sub=2, jitter=0.25, seed=3, smooth=True),
        ico(leaf2, 0.75, loc=(0.1, -0.4, 3.9), sub=2, jitter=0.25, seed=4, smooth=True),
    ]
    out.append(join('tree', [trunk, br1, br2] + crown))

    # Pine tree variant reads well in the distance.
    pine = [cyl(bark, 0.14, 1.0, loc=(0, 0, 0.5), verts=8)]
    for i, (r, z) in enumerate([(1.1, 1.3), (0.85, 2.1), (0.6, 2.8)]):
        pine.append(cyl(leaf3 if i % 2 == 0 else leaf, r, 1.2, loc=(0, 0, z), r2=0.05, verts=9, smooth=False))
    out.append(join('pine', pine))

    out.append(join('bush', [
        ico(leaf, 0.6, loc=(0, 0, 0.42), sub=2, jitter=0.3, seed=5, smooth=True),
        ico(leaf2, 0.45, loc=(0.5, -0.1, 0.32), sub=2, jitter=0.3, seed=6, smooth=True),
        ico(leaf3, 0.42, loc=(-0.45, 0.1, 0.3), sub=2, jitter=0.3, seed=7, smooth=True),
    ]))

    out.append(join('rock', [
        ico(rock_m, 0.55, loc=(0, 0, 0.2), scale=(1.2, 0.9, 0.65), sub=1, jitter=0.35, seed=8),
        ico(rock_m, 0.3, loc=(0.55, 0.15, 0.1), scale=(1, 0.9, 0.7), sub=1, jitter=0.35, seed=9),
    ]))

    # Fence: one 2.4 m bay, post on the left, two rails.
    out.append(join('fence', [
        cube(wood_dk, (0.12, 0.12, 1.05), loc=(-1.2, 0, 0.52), bevel=0.015),
        cube(wood_dk, (0.14, 0.14, 0.04), loc=(-1.2, 0, 1.06), bevel=0.01),
        cube(wood, (2.4, 0.05, 0.11), loc=(0, 0.04, 0.78), bevel=0.012),
        cube(wood, (2.4, 0.05, 0.11), loc=(0, 0.04, 0.42), bevel=0.012),
    ]))

    # Lamp post with an arm reaching over the track (+X is along the track, -Y towards camera).
    out.append(join('lamp', [
        cyl(steel, 0.11, 0.25, loc=(0, 0, 0.12), verts=12),
        cyl(steel, 0.06, 4.0, loc=(0, 0, 2.1), r2=0.045, verts=12),
        cyl(steel, 0.035, 0.9, loc=(0, -0.42, 4.05), rot=(math.radians(90), 0, 0), verts=8),
        cube(steel, (0.3, 0.42, 0.12), loc=(0, -0.85, 4.02), bevel=0.03),
        cube(light, (0.24, 0.34, 0.03), loc=(0, -0.85, 3.95), bevel=0.01),
    ]))

    out.append(join('cone', [
        cube(cone_m, (0.42, 0.42, 0.04), loc=(0, 0, 0.02), bevel=0.01),
        cyl(cone_m, 0.17, 0.55, loc=(0, 0, 0.3), r2=0.025, verts=16),
        cyl(white, 0.122, 0.09, loc=(0, 0, 0.3), r2=0.1, verts=16),
    ]))

    out.append(join('bench', [
        cube(bench_wood, (1.7, 0.12, 0.05), loc=(0, -0.12, 0.46), bevel=0.012),
        cube(bench_wood, (1.7, 0.12, 0.05), loc=(0, 0.04, 0.46), bevel=0.012),
        cube(bench_wood, (1.7, 0.05, 0.12), loc=(0, 0.17, 0.72), bevel=0.012),
        cube(bench_wood, (1.7, 0.05, 0.12), loc=(0, 0.19, 0.88), bevel=0.012),
        cube(iron, (0.06, 0.4, 0.06), loc=(-0.72, 0, 0.42), bevel=0.01),
        cube(iron, (0.06, 0.4, 0.06), loc=(0.72, 0, 0.42), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.45), loc=(-0.72, -0.16, 0.22), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.45), loc=(0.72, -0.16, 0.22), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.95), loc=(-0.72, 0.16, 0.47), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.95), loc=(0.72, 0.16, 0.47), bevel=0.01),
    ]))

    build_beach(out)
    build_city(out)
    build_snow(out)
    build_desert(out)
    build_jungle(out)
    build_volcano(out)
    export(os.path.join(OUT, 'props.glb'), out)



# ---------------------------------------------------------------- biome props

def bend_strip(material, length, width, droop, segs=8, loc=(0, 0, 0), yaw=0.0, pitch=0.0, taper=True):
    """A drooping leaf strip (palm frond) built along +X, then rotated."""
    bm = bmesh.new()
    rows = []
    for i in range(segs + 1):
        t = i / segs
        x = t * length
        z = -droop * t * t
        w = width * (math.sin(math.pi * min(1.0, t * 1.15)) if taper else 1.0) + 0.01
        rows.append((bm.verts.new((x, -w / 2, z)), bm.verts.new((x, 0, z + w * 0.15)), bm.verts.new((x, w / 2, z))))
    for a, b in zip(rows, rows[1:]):
        bm.faces.new((a[0], b[0], b[1], a[1]))
        bm.faces.new((a[1], b[1], b[2], a[2]))
    me = bpy.data.meshes.new('strip')
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('strip', me)
    bpy.context.collection.objects.link(o)
    o.rotation_euler = (0, pitch, yaw)
    o.location = loc
    apply_tf(o)
    o = finish(o, material, True)
    sol = o.modifiers.new('sol', 'SOLIDIFY')
    sol.thickness = 0.02
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier='sol')
    return o


def striped_cone(mats, r, depth, loc, verts=12, r2=0.0):
    o = cyl(mats[0], r, depth, loc=loc, r2=r2, verts=verts, smooth=False)
    for m in mats[1:]:
        o.data.materials.append(m)
    for i, p in enumerate(o.data.polygons):
        c = p.center
        ang = math.atan2(c.y - loc[1], c.x - loc[0])
        p.material_index = int(((ang + math.pi) / (2 * math.pi)) * verts) % len(mats)
    return o


def build_beach(out):
    trunk = mat('palm_trunk', (166, 120, 78))
    trunk_dk = mat('palm_trunk_dark', (128, 90, 56))
    frond = mat('palm_frond', (70, 168, 72))
    frond2 = mat('palm_frond_light', (110, 196, 86))
    coconut = mat('coconut', (110, 72, 40))
    red = mat('red', (230, 60, 50))
    white = mat('white', (245, 245, 245))
    yellow = mat('yellow', (255, 206, 60))
    blue = mat('sea_blue', (40, 150, 220))
    wood = mat('beach_wood', (214, 168, 110))
    wood_dk = mat('beach_wood_dark', (150, 108, 66))
    rope = mat('rope', (222, 196, 140))
    teal = mat('teal', (40, 190, 180))

    # Palm: leaning segmented trunk, drooping fronds, coconuts.
    parts = []
    lean = 0.35
    top = Vector((0, 0, 0))
    n = 9
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n
        p0 = Vector((lean * t0 * t0 * 1.6, 0, 4.2 * t0))
        p1 = Vector((lean * t1 * t1 * 1.6, 0, 4.2 * t1))
        mid = (p0 + p1) / 2
        d = p1 - p0
        rot = (0, math.atan2(d.x, d.z), 0)
        r = 0.2 - 0.07 * t0
        parts.append(cyl(trunk if i % 2 == 0 else trunk_dk, r, d.length * 1.02, loc=tuple(mid), rot=rot, r2=r * 0.86, verts=10))
        top = p1
    for k in range(7):
        yaw = k * 2 * math.pi / 7 + 0.3
        parts.append(bend_strip(frond if k % 2 else frond2, 1.9, 0.42, 0.9, loc=tuple(top), yaw=yaw, pitch=-0.25))
    for k in range(3):
        a = k * 2.1
        parts.append(sphere(coconut, 0.11, loc=(top.x + 0.13 * math.cos(a), 0.13 * math.sin(a), top.z - 0.15), segs=10, rings=8))
    out.append(join('palm', parts))

    # Beach umbrella with towel.
    out.append(join('umbrella', [
        cyl(white, 0.03, 2.2, loc=(0, 0, 1.1), verts=8),
        striped_cone([red, white], 1.1, 0.5, loc=(0, 0, 2.15), verts=12, r2=0.02),
        cube(teal, (1.6, 0.8, 0.02), loc=(0.6, -0.9, 0.01)),
        cube(white, (0.3, 0.8, 0.021), loc=(0.6, -0.9, 0.012)),
    ]))

    # Lifeguard tower.
    lg = []
    for x in (-0.6, 0.6):
        for y in (-0.6, 0.6):
            lg.append(cube(white, (0.1, 0.1, 2.0), loc=(x, y, 1.0), bevel=0.01))
    lg += [
        cube(wood, (1.5, 1.5, 0.1), loc=(0, 0, 2.0), bevel=0.01),
        cube(red, (1.3, 1.2, 0.9), loc=(0, 0.1, 2.5), bevel=0.02),
        cube(white, (1.0, 0.05, 0.4), loc=(0, -0.5, 2.6), bevel=0.01),
        cube(white, (1.6, 1.6, 0.08), loc=(0, 0.1, 3.0), rot=(math.radians(-8), 0, 0), bevel=0.02),
        cube(wood_dk, (0.5, 1.6, 0.06), loc=(0, -1.25, 1.0), rot=(math.radians(-50), 0, 0), bevel=0.01),
        cyl(red, 0.25, 0.08, loc=(0.75, -0.3, 2.5), rot=(0, math.pi / 2, 0), verts=16),
    ]
    out.append(join('lifeguard', lg))

    # Surf shack.
    sh = [
        cube(wood, (2.4, 1.8, 1.9), loc=(0, 0, 0.95), bevel=0.02),
        cube(wood_dk, (2.9, 2.3, 0.12), loc=(0, 0, 2.0), rot=(math.radians(-10), 0, 0), bevel=0.02),
        cube(wood_dk, (2.0, 0.2, 0.08), loc=(0, -1.0, 1.0), bevel=0.01),
        cube(blue, (1.6, 0.05, 0.6), loc=(0, -0.92, 1.5), bevel=0.01),
        cube(yellow, (1.4, 0.06, 0.35), loc=(0, -0.95, 2.25), bevel=0.01),
    ]
    for x in (-1.0, 1.0):
        sh.append(cyl(wood_dk, 0.06, 1.2, loc=(x, -1.15, 1.5), verts=8))
    out.append(join('shack', sh))

    # Rope fence: post plus a sagging rope to the next post 2.4 m along.
    rf = [cyl(wood_dk, 0.07, 1.0, loc=(-1.2, 0, 0.5), verts=8), sphere(wood_dk, 0.08, loc=(-1.2, 0, 1.0), segs=8, rings=6)]
    pts = [(-1.2 + 2.4 * i / 6, 0.85 - 0.18 * math.sin(math.pi * i / 6)) for i in range(7)]
    for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
        d = math.hypot(x1 - x0, z1 - z0)
        rf.append(cyl(rope, 0.02, d * 1.05, loc=((x0 + x1) / 2, 0, (z0 + z1) / 2), rot=(0, math.atan2(x1 - x0, z1 - z0), 0), verts=6))
    out.append(join('ropefence', rf))

    # Surfboard stuck upright in the sand.
    board = sphere(yellow, 0.5, loc=(0, 0, 0.85), scale=(0.55, 0.09, 2.0), segs=20, rings=14)
    stripe = sphere(red, 0.5, loc=(0, -0.002, 0.85), scale=(0.12, 0.092, 1.98), segs=12, rings=14)
    out.append(join('surfboard', [board, stripe]))

    out.append(join('beachball', [striped_cone([red, white, blue, yellow], 0.25, 0.0001, loc=(0, 0, 0.25), verts=8)] if False else [
        sphere(red, 0.25, loc=(0, 0, 0.25), segs=16, rings=10),
        sphere(white, 0.252, loc=(0, 0, 0.25), scale=(0.35, 1, 1), segs=16, rings=10),
    ]))


def build_city(out):
    steel = mat('city_steel', (120, 128, 140))
    steel_dk = mat('city_steel_dark', (70, 76, 88))
    tank_wood = mat('tank_wood', (150, 100, 64))
    tank_band = mat('tank_band', (60, 60, 66))
    brick = mat('brick', (170, 80, 60))
    brick_cap = mat('brick_cap', (110, 110, 116))
    ac = mat('ac_unit', (205, 210, 214))
    grille = mat('grille', (60, 64, 70))
    red = mat('red', (230, 60, 50))
    white = mat('white', (245, 245, 245))

    # Water tank on legs.
    wt = []
    for x in (-0.8, 0.8):
        for y in (-0.8, 0.8):
            wt.append(cube(steel_dk, (0.1, 0.1, 2.0), loc=(x, y, 1.0)))
    wt += [
        cube(steel_dk, (1.9, 1.9, 0.1), loc=(0, 0, 2.0)),
        cyl(tank_wood, 1.0, 2.2, loc=(0, 0, 3.15), verts=20),
        cyl(tank_band, 1.03, 0.08, loc=(0, 0, 2.5), verts=20),
        cyl(tank_band, 1.03, 0.08, loc=(0, 0, 3.4), verts=20),
        cyl(tank_band, 1.08, 0.7, loc=(0, 0, 4.6), r2=0.05, verts=20, smooth=False),
    ]
    out.append(join('watertank', wt))

    out.append(join('acunit', [
        cube(ac, (1.2, 0.9, 0.9), loc=(0, 0, 0.45), bevel=0.04),
        cyl(grille, 0.32, 0.04, loc=(0, -0.45, 0.48), rot=(math.pi / 2, 0, 0), verts=20),
        cube(grille, (0.05, 0.02, 0.5), loc=(0, -0.475, 0.48)),
        cube(grille, (0.5, 0.02, 0.05), loc=(0, -0.475, 0.48)),
    ]))

    out.append(join('chimney', [
        cube(brick, (0.7, 0.7, 1.6), loc=(0, 0, 0.8), bevel=0.02),
        cube(brick_cap, (0.85, 0.85, 0.12), loc=(0, 0, 1.62), bevel=0.02),
        cyl(steel_dk, 0.12, 0.4, loc=(0.1, 0, 1.85), verts=10),
    ]))

    out.append(join('antenna', [
        cyl(steel_dk, 0.05, 4.5, loc=(0, 0, 2.25), verts=8),
        cube(steel_dk, (1.4, 0.04, 0.04), loc=(0, 0, 3.6)),
        cube(steel_dk, (1.0, 0.04, 0.04), loc=(0, 0, 4.0)),
        cube(steel_dk, (0.6, 0.04, 0.04), loc=(0, 0, 4.4)),
        sphere(red, 0.07, loc=(0, 0, 4.55), segs=10, rings=6),
        cyl(white, 0.45, 0.18, loc=(0.2, -0.2, 2.2), rot=(math.radians(60), 0, math.radians(20)), r2=0.12, verts=16),
    ]))

    rl = [cyl(steel, 0.035, 1.1, loc=(-1.2, 0, 0.55), verts=8), cyl(steel, 0.035, 1.1, loc=(0, 0, 0.55), verts=8)]
    rl.append(cyl(steel, 0.03, 2.4, loc=(0, 0, 1.08), rot=(0, math.pi / 2, 0), verts=8))
    rl.append(cyl(steel, 0.025, 2.4, loc=(0, 0, 0.6), rot=(0, math.pi / 2, 0), verts=8))
    out.append(join('railing', rl))

    out.append(join('vent', [
        cyl(steel, 0.18, 0.7, loc=(0, 0, 0.35), verts=14),
        cyl(steel_dk, 0.32, 0.18, loc=(0, 0, 0.82), r2=0.08, verts=14),
        cyl(steel, 0.2, 0.06, loc=(0, 0, 0.72), verts=14),
    ]))


def build_snow(out):
    snow = mat('snow', (240, 246, 252))
    snow_sh = mat('snow_shade', (210, 226, 242))
    pine = mat('pine_dark', (34, 104, 72))
    pine2 = mat('pine_mid', (46, 124, 84))
    bark = mat('bark', (122, 82, 50))
    log = mat('log', (140, 90, 52))
    log_dk = mat('log_dark', (100, 62, 36))
    window = mat('window_glow', (255, 214, 120))
    orange = mat('orange', (255, 120, 30))
    coal = mat('coal', (40, 40, 44))
    red = mat('red', (230, 60, 50))
    steel = mat('city_steel', (120, 128, 140))
    rock_m = mat('rock', (150, 152, 156))

    sp = [cyl(bark, 0.15, 1.0, loc=(0, 0, 0.5), verts=8)]
    for i, (r, z) in enumerate([(1.2, 1.3), (0.95, 2.1), (0.7, 2.85), (0.45, 3.5)]):
        sp.append(cyl(pine if i % 2 == 0 else pine2, r, 1.1, loc=(0, 0, z), r2=0.05, verts=9, smooth=False))
        sp.append(cyl(snow, r * 0.62, 0.42, loc=(0, 0, z + 0.36), r2=0.05, verts=9, smooth=False))
    out.append(join('snowpine', sp))

    cb = []
    for i in range(7):
        z = 0.15 + i * 0.28
        cb.append(cyl(log if i % 2 else log_dk, 0.15, 3.2, loc=(0, -1.1, z), rot=(0, math.pi / 2, 0), verts=10))
        cb.append(cyl(log if i % 2 == 0 else log_dk, 0.15, 2.4, loc=(-1.45, 0, z), rot=(math.pi / 2, 0, 0), verts=10))
        cb.append(cyl(log if i % 2 == 0 else log_dk, 0.15, 2.4, loc=(1.45, 0, z), rot=(math.pi / 2, 0, 0), verts=10))
    cb += [
        cube(log_dk, (2.9, 2.2, 1.95), loc=(0, 0, 1.0)),
        cube(snow, (3.6, 1.6, 0.18), loc=(0, -0.65, 2.45), rot=(math.radians(35), 0, 0), bevel=0.05),
        cube(snow, (3.6, 1.6, 0.18), loc=(0, 0.65, 2.45), rot=(math.radians(-35), 0, 0), bevel=0.05),
        cube(log_dk, (0.6, 0.06, 1.1), loc=(0.6, -1.27, 0.55)),
        cube(window, (0.6, 0.06, 0.5), loc=(-0.7, -1.27, 1.1)),
        cube(log_dk, (0.7, 0.07, 0.08), loc=(-0.7, -1.29, 1.1)),
        cube(rock_m, (0.45, 0.45, 1.4), loc=(1.0, 0.4, 2.7), bevel=0.03),
        cube(snow, (0.55, 0.55, 0.12), loc=(1.0, 0.4, 3.42), bevel=0.04),
    ]
    out.append(join('cabin', cb))

    out.append(join('snowman', [
        sphere(snow, 0.45, loc=(0, 0, 0.42), segs=18, rings=12),
        sphere(snow, 0.33, loc=(0, 0, 1.0), segs=18, rings=12),
        sphere(snow, 0.24, loc=(0, 0, 1.45), segs=18, rings=12),
        cyl(orange, 0.04, 0.22, loc=(0, -0.3, 1.45), rot=(math.pi / 2, 0, 0), r2=0.005, verts=8),
        sphere(coal, 0.03, loc=(0.08, -0.21, 1.53), segs=8, rings=6),
        sphere(coal, 0.03, loc=(-0.08, -0.21, 1.53), segs=8, rings=6),
        sphere(coal, 0.035, loc=(0, -0.32, 1.08), segs=8, rings=6),
        sphere(coal, 0.035, loc=(0, -0.33, 0.92), segs=8, rings=6),
        cyl(red, 0.26, 0.1, loc=(0, 0, 1.24), verts=16),
        cube(red, (0.1, 0.05, 0.35), loc=(0.15, -0.24, 1.08), rot=(0, math.radians(-15), 0)),
        cyl(coal, 0.22, 0.04, loc=(0, 0, 1.64), verts=16),
        cyl(coal, 0.15, 0.25, loc=(0, 0, 1.78), verts=16),
        cyl(bark, 0.02, 0.6, loc=(0.42, 0, 1.1), rot=(0, math.radians(60), 0), verts=6),
        cyl(bark, 0.02, 0.6, loc=(-0.42, 0, 1.1), rot=(0, math.radians(-60), 0), verts=6),
    ]))

    out.append(join('liftpylon', [
        cyl(steel, 0.18, 7.0, loc=(0, 0, 3.5), r2=0.12, verts=10),
        cube(steel, (0.2, 3.0, 0.2), loc=(0, 0, 7.0)),
        cyl(red, 0.25, 0.1, loc=(0, -1.3, 6.85), rot=(0, math.pi / 2, 0), verts=14),
        cyl(red, 0.25, 0.1, loc=(0, 1.3, 6.85), rot=(0, math.pi / 2, 0), verts=14),
        cube(snow, (0.5, 0.5, 0.15), loc=(0, 0, 0.07), bevel=0.04),
    ]))

    sf = [cyl(log_dk, 0.04, 1.2, loc=(-1.2, 0, 0.6), verts=6)]
    for i in range(5):
        sf.append(cube(orange, (2.4, 0.02, 0.07), loc=(0, 0, 0.25 + i * 0.2)))
    for i in range(9):
        sf.append(cube(orange, (0.05, 0.02, 0.9), loc=(-1.0 + i * 0.25, 0, 0.6)))
    out.append(join('snowfence', sf))

    out.append(join('snowrock', [
        ico(rock_m, 0.6, loc=(0, 0, 0.25), scale=(1.3, 1.0, 0.75), sub=1, jitter=0.35, seed=11),
        ico(snow, 0.55, loc=(0, 0, 0.5), scale=(1.25, 0.95, 0.35), sub=1, jitter=0.25, seed=12, smooth=True),
    ]))


def build_desert(out):
    cactus = mat('cactus', (78, 150, 84))
    cactus_dk = mat('cactus_dark', (58, 122, 66))
    flower = mat('cactus_flower', (240, 90, 140))
    red_rock = mat('red_rock', (196, 104, 64))
    red_rock2 = mat('red_rock_light', (222, 140, 90))
    sand_rock = mat('sand_rock', (214, 170, 110))
    bone = mat('bone', (236, 226, 204))
    tumble = mat('tumbleweed', (170, 130, 80))
    wood_dk = mat('fence_wood_dark', (160, 108, 60))

    cc = [capsule(cactus, 0.22, 0.24, 3.0, loc=(0, 0, 3.0))]
    cc += [
        capsule(cactus_dk, 0.13, 0.14, 0.8, loc=(0.5, 0, 2.2)),
        cyl(cactus_dk, 0.13, 0.4, loc=(0.32, 0, 1.4), rot=(0, math.pi / 2, 0), verts=12),
        capsule(cactus_dk, 0.12, 0.13, 0.7, loc=(-0.45, 0, 2.5)),
        cyl(cactus_dk, 0.12, 0.35, loc=(-0.3, 0, 1.85), rot=(0, math.pi / 2, 0), verts=12),
        sphere(flower, 0.07, loc=(0, 0, 3.02), segs=10, rings=6),
    ]
    out.append(join('cactus', cc))

    out.append(join('barrelcactus', [
        sphere(cactus, 0.32, loc=(0, 0, 0.28), scale=(1, 1, 0.9), segs=12, rings=8, smooth=False),
        sphere(flower, 0.06, loc=(0, 0, 0.57), segs=8, rings=6),
    ]))

    # Layered sandstone butte for the middle distance.
    mesa = []
    for i, (w, h, z, m) in enumerate([(6, 3, 1.5, red_rock), (5, 2.5, 4.2, red_rock2), (4.2, 2.4, 6.6, red_rock), (3.6, 0.5, 8.0, sand_rock)]):
        mesa.append(ico(m, 1, loc=(0, 0, z), scale=(w / 2, w / 2.6, h / 2), sub=1, jitter=0.15, seed=20 + i))
    out.append(join('mesa', mesa))

    out.append(join('desertrock', [
        ico(red_rock, 0.7, loc=(0, 0, 0.3), scale=(1.3, 1.0, 0.7), sub=1, jitter=0.35, seed=31),
        ico(red_rock2, 0.4, loc=(0.7, 0.2, 0.15), scale=(1, 0.9, 0.8), sub=1, jitter=0.35, seed=32),
    ]))

    tw = []
    for k in range(5):
        tw.append(ico(tumble, 0.35, loc=(0, 0, 0.35), scale=(1, 1, 1), sub=1, jitter=0.4, seed=40 + k))
        tw[-1].rotation_euler = (k, k * 0.7, k * 1.3)
        apply_tf(tw[-1])
    for o in tw:
        w = o.modifiers.new('wf', 'WIREFRAME')
        w.thickness = 0.03
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='wf')
    out.append(join('tumbleweed', tw))

    out.append(join('skull', [
        sphere(bone, 0.18, loc=(0, 0, 0.14), scale=(1, 1.3, 0.8), segs=12, rings=8),
        cyl(bone, 0.04, 0.5, loc=(0.25, 0.1, 0.25), rot=(0, math.radians(60), 0), r2=0.01, verts=8),
        cyl(bone, 0.04, 0.5, loc=(-0.25, 0.1, 0.25), rot=(0, math.radians(-60), 0), r2=0.01, verts=8),
    ]))

    out.append(join('signpost', [
        cube(wood_dk, (0.1, 0.1, 1.8), loc=(0, 0, 0.9)),
        cube(wood_dk, (0.9, 0.05, 0.25), loc=(0.3, -0.06, 1.5), rot=(0, math.radians(-8), 0), bevel=0.01),
        cube(wood_dk, (0.8, 0.05, 0.22), loc=(-0.25, -0.06, 1.15), rot=(0, math.radians(6), 0), bevel=0.01),
    ]))


def build_jungle(out):
    trunk = mat('jungle_trunk', (110, 84, 60))
    leaf = mat('jungle_leaf', (40, 150, 70))
    leaf2 = mat('jungle_leaf_light', (90, 190, 80))
    leaf3 = mat('jungle_leaf_dark', (28, 110, 60))
    stone = mat('temple_stone', (150, 150, 130))
    stone_dk = mat('temple_stone_dark', (110, 112, 96))
    moss = mat('moss', (90, 150, 60))
    flower = mat('jungle_flower', (250, 80, 90))
    yellow = mat('yellow', (255, 206, 60))

    jt = [cyl(trunk, 0.3, 6.0, loc=(0, 0, 3.0), r2=0.18, verts=10)]
    for i in range(4):
        a = i * math.pi / 2 + 0.4
        jt.append(cyl(trunk, 0.12, 1.6, loc=(0.5 * math.cos(a), 0.5 * math.sin(a), 5.2), rot=(math.sin(a) * -0.9, math.cos(a) * 0.9, 0), r2=0.06, verts=8))
    for i, (x, y, z, r, m) in enumerate([(0, 0, 6.4, 1.8, leaf), (1.2, 0.3, 5.9, 1.3, leaf2), (-1.2, -0.2, 6.0, 1.4, leaf3), (0.3, -0.8, 6.9, 1.1, leaf2)]):
        jt.append(ico(m, r, loc=(x, y, z), scale=(1, 1, 0.55), sub=2, jitter=0.25, seed=50 + i, smooth=True))
    for k in range(6):
        jt.append(cyl(leaf3, 0.025, 1.5 + (k % 3) * 0.6, loc=(-1.2 + k * 0.5, -0.3, 5.0 - (k % 3) * 0.3), verts=5))
    out.append(join('jungletree', jt))

    fn = []
    for k in range(8):
        yaw = k * 2 * math.pi / 8
        fn.append(bend_strip(leaf if k % 2 else leaf2, 1.0, 0.3, 0.5, loc=(0, 0, 0.35), yaw=yaw, pitch=-0.7))
    fn.append(sphere(flower, 0.08, loc=(0.1, 0, 0.55), segs=8, rings=6))
    out.append(join('fern', fn))

    pl = [
        cube(stone_dk, (0.9, 0.9, 0.3), loc=(0, 0, 0.15), bevel=0.03),
        cyl(stone, 0.32, 3.0, loc=(0, 0, 1.8), verts=12),
        cube(stone_dk, (0.95, 0.95, 0.3), loc=(0, 0, 3.4), bevel=0.03),
        ico(moss, 0.35, loc=(0.2, -0.3, 3.55), scale=(1.4, 1.2, 0.4), sub=1, jitter=0.3, seed=61, smooth=True),
        ico(moss, 0.3, loc=(-0.25, -0.25, 1.0), scale=(0.8, 0.6, 1.4), sub=1, jitter=0.3, seed=62, smooth=True),
    ]
    out.append(join('pillar', pl))

    out.append(join('stonehead', [
        cube(stone, (1.2, 1.0, 1.5), loc=(0, 0, 0.75), bevel=0.12, segs=2),
        cube(stone_dk, (1.3, 0.3, 0.25), loc=(0, -0.42, 1.15), bevel=0.04),
        cube(stone_dk, (0.25, 0.35, 0.5), loc=(0, -0.55, 0.85), bevel=0.05),
        cube(stone_dk, (0.6, 0.15, 0.12), loc=(0, -0.5, 0.45), bevel=0.03),
        cube(yellow, (0.18, 0.06, 0.1), loc=(0.3, -0.5, 1.15)),
        cube(yellow, (0.18, 0.06, 0.1), loc=(-0.3, -0.5, 1.15)),
        ico(moss, 0.5, loc=(0, 0, 1.55), scale=(1.3, 1.1, 0.35), sub=1, jitter=0.3, seed=63, smooth=True),
    ]))

    rw = []
    for i in range(3):
        for j in range(3 - (i % 2)):
            rw.append(cube(stone if (i + j) % 2 else stone_dk, (0.75, 0.5, 0.45), loc=(-0.8 + j * 0.8 + (i % 2) * 0.4, 0, 0.23 + i * 0.47), bevel=0.04))
    rw.append(ico(moss, 0.4, loc=(0.3, -0.1, 1.45), scale=(1.6, 0.8, 0.4), sub=1, jitter=0.3, seed=64, smooth=True))
    out.append(join('ruinwall', rw))


def build_volcano(out):
    basalt = mat('basalt', (58, 54, 60))
    basalt2 = mat('basalt_light', (84, 78, 86))
    lava = mat('lava', (255, 110, 30))
    charred = mat('charred', (44, 36, 34))
    ember = mat('ember', (255, 70, 40))

    bc = []
    for i, (x, y, h) in enumerate([(0, 0, 2.6), (0.55, 0.1, 1.8), (-0.5, 0.15, 2.1), (0.1, 0.55, 1.4), (-0.2, -0.45, 1.1)]):
        bc.append(cyl(basalt if i % 2 else basalt2, 0.3, h, loc=(x, y, h / 2), verts=6, smooth=False))
    out.append(join('basalt', bc))

    dt = [cyl(charred, 0.18, 2.6, loc=(0, 0, 1.3), r2=0.08, verts=8)]
    for i, (a, z, l) in enumerate([(0.7, 1.8, 1.0), (-0.8, 2.1, 0.9), (2.4, 1.5, 0.8)]):
        dt.append(cyl(charred, 0.06, l, loc=(0.35 * math.cos(a), 0.35 * math.sin(a), z + 0.2), rot=(math.sin(a) * 0.9, math.cos(a) * 0.9, 0), r2=0.02, verts=6))
    dt.append(sphere(ember, 0.05, loc=(0.1, -0.15, 1.0), segs=6, rings=4))
    out.append(join('deadtree', dt))

    out.append(join('lavarock', [
        ico(basalt, 0.7, loc=(0, 0, 0.3), scale=(1.3, 1.0, 0.7), sub=1, jitter=0.35, seed=71),
        ico(lava, 0.2, loc=(0.3, -0.45, 0.25), scale=(1.2, 0.5, 0.6), sub=1, jitter=0.2, seed=72, smooth=True),
        ico(lava, 0.15, loc=(-0.4, -0.4, 0.4), scale=(1, 0.5, 0.6), sub=1, jitter=0.2, seed=73, smooth=True),
    ]))

    out.append(join('vent_rock', [
        cyl(basalt2, 0.9, 0.9, loc=(0, 0, 0.45), r2=0.4, verts=10, smooth=False),
        cyl(lava, 0.38, 0.05, loc=(0, 0, 0.9), verts=10),
    ]))


if __name__ == '__main__':
    build_skater()
    build_props()
